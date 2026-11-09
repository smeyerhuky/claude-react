"""Plot conditional research budgets, not measured route costs or release coverage."""
import argparse
import json
from pathlib import Path
from metro_state_anchor_domains import OUTPUT, audit


def render(output, root=OUTPUT):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    report = audit(root)
    if report != json.loads((Path(root)/'report.json').read_bytes()):
        raise ValueError('Unchanged hierarchical domain checkpoint required')
    labels,counts,colors = [],[],[]
    for context in report['contexts']:
        for case in context['hypotheses']:
            numerator,denominator=case['assumed_full_incumbent_upper_bound_m']
            budget=int(numerator)/int(denominator)/1000
            label='Point' if context['context']=='point' else 'Whole window (uniform bound)'
            labels.append(f'{label}: assumed ≤{budget:g} km')
            counts.append(len(case['retained_or_unknown_ids']))
            colors.append('#416b80' if label=='Point' else '#8865a3')
    figure,ax=plt.subplots(figsize=(11,6),layout='constrained')
    bars=ax.barh(labels,counts,color=colors,height=.6)
    ax.bar_label(bars,padding=6); ax.invert_yaxis()
    ax.set(xlim=(0,max(counts)+2),xlabel='Metros retained for further work under the stated hypothesis',
           title='Conditional competitor counts across the complete 359-metro inventory')
    figure.suptitle('Planning hypotheses: no feasible incumbent routes certified',fontsize=14)
    figure.supxlabel('No exclusions are applied. Requires valid location domains, full directed costs and separate exterior-route coverage checks.',fontsize=9)
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    figure.savefig(output,dpi=150);plt.close(figure)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output',type=Path);parser.add_argument('--root',type=Path,default=OUTPUT)
    args=parser.parse_args();render(args.output,args.root)
