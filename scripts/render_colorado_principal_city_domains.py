"""Plot selected retained city footprints; not road regions or adopted anchors."""
import argparse
import json
import math
from pathlib import Path

from colorado_principal_city_domains import OUTPUT, QUERY_POINT, audit, load_features


def render(output, root=OUTPUT):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    if audit(root) != json.loads((Path(root)/'report.json').read_bytes()):
        raise ValueError('Unchanged city-domain checkpoint required')
    features = load_features(root)
    panels = [('Fort Collins / Loveland / Greeley', ['0827425','0846465','0832155']),
              ('Denver metro: all five principal cities', ['0804000','0809280','0812815','0816495','0820000'])]
    colors = ['#226e8a','#8054a0','#b55e20','#567738','#b34863']
    figure, axes = plt.subplots(1, 2, figsize=(12, 7), layout='constrained')
    for ax, (title, identities) in zip(axes, panels):
        bounds = [features[identity][1].bounds for identity in identities]
        west, south = min(b[0] for b in bounds)-.025, min(b[1] for b in bounds)-.025
        east, north = max(b[2] for b in bounds)+.025, max(b[3] for b in bounds)+.025
        for color, identity in zip(colors, identities):
            properties, geometry = features[identity]; first = True
            for polygon in (geometry.geoms if geometry.geom_type == 'MultiPolygon' else [geometry]):
                for ring in [polygon.exterior, *polygon.interiors]:
                    ax.plot(*ring.xy, color=color, linewidth=.7, label=properties['name'] if first else None)
                    first = False
        if west <= QUERY_POINT[0] <= east and south <= QUERY_POINT[1] <= north:
            ax.scatter(*QUERY_POINT, color='#17232f', marker='x', s=35, label='Research query point')
        ax.set(xlim=(west,east), ylim=(south,north), xlabel='Longitude', ylabel='Latitude', title=title)
        ax.set_aspect(1/math.cos(math.radians((north+south)/2)))
        ax.tick_params(axis='x', labelrotation=25); ax.legend(fontsize=8, loc='upper right')
    figure.suptitle('Census 2025 place footprints joined to official principal-city identities', fontsize=14)
    figure.supxlabel('Selected panels. City footprints are conditional model domains; vehicle access and road regions remain unverified.', fontsize=10)
    output = Path(output); output.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(output, dpi=150); plt.close(figure)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path); parser.add_argument('--root', type=Path, default=OUTPUT)
    args = parser.parse_args(); render(args.output, args.root)
