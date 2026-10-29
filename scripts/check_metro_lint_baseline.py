"""Reject new diagnostics in the existing component without hiding old debt."""
import argparse
from collections import Counter
import json
from pathlib import Path
import subprocess
import tempfile

p=argparse.ArgumentParser(description=__doc__);p.add_argument('baseline_commit');args=p.parse_args()
component=Path('src/components/MetroPopulationVoronoi.jsx')
raw=subprocess.check_output(['git','show',args.baseline_commit+':'+str(component)])
with tempfile.NamedTemporaryFile(dir=component.parent,prefix='MetroLintBaseline',suffix='.jsx') as temporary:
    temporary.write(raw);temporary.flush()
    def diagnostics(path):
        run=subprocess.run(['node','node_modules/eslint/bin/eslint.js',str(path),'--format','json'],capture_output=True,text=True)
        if run.returncode not in (0,1):raise RuntimeError(run.stderr or run.stdout)
        data=json.loads(run.stdout)
        return Counter((m['ruleId'],m['severity'],m['message']) for file in data for m in file['messages'])
    baseline=diagnostics(temporary.name);current=diagnostics(component)
    new=current-baseline
    if new:raise SystemExit('New component lint diagnostics: '+str(new))
    print(json.dumps({'preexisting_diagnostics':sum(baseline.values()),'current_diagnostics':sum(current.values()),'new_diagnostics':0}))
