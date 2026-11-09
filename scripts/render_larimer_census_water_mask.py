"""Render supplied Census water and excluded mask cells, not a road coverage map."""
import argparse
import json
import math
from pathlib import Path

from larimer_census_water_mask import OUTPUT, audit


def render(output, root=OUTPUT):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.colors import ListedColormap
    from shapely.geometry import shape
    report = audit(root)
    if report != json.loads((Path(root)/'report.json').read_bytes()):
        raise ValueError('Figure requires the unchanged retained checkpoint')
    west, south, east, north = report['mask']['bounds_lonlat']
    figure, axes = plt.subplots(1, 2, figsize=(12, 7), layout='constrained')
    for ax in axes:
        ax.set_facecolor('#e6e8eb')
        ax.set(xlim=(west, east), ylim=(south, north), xlabel='Longitude', ylabel='Latitude')
        ax.set_aspect(1/math.cos(math.radians((south+north)/2)))
        ax.tick_params(axis='x', labelrotation=25)
    for feature in json.loads((Path(root)/'water.geojson').read_bytes())['features']:
        geometry = shape(feature['geometry'])
        for polygon in (geometry.geoms if geometry.geom_type == 'MultiPolygon' else [geometry]):
            for ring in [polygon.exterior, *polygon.interiors]:
                axes[0].plot(*ring.xy, color='#175c87', linewidth=0.6)
    axes[0].set_title('279 supplied water polygon outlines')
    axes[1].imshow(report['mask']['land_mask'], origin='upper', extent=(west, east, south, north),
                   interpolation='nearest', aspect=1/math.cos(math.radians((south+north)/2)), cmap=ListedColormap(['#175c87', '#e6e8eb']), vmin=0, vmax=1)
    axes[1].set_title('1,289 water-contact cells excluded / 7,500')
    figure.suptitle('Fort Collins area: Census 2025 water-mask checkpoint', fontsize=16)
    figure.supxlabel('Blue: mapped-water contact excluded. Gray: nonwater candidate only; road access and coverage unverified.', fontsize=10)
    output = Path(output); output.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(output, dpi=150)
    plt.close(figure)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--root', type=Path, default=OUTPUT)
    args = parser.parse_args(); render(args.output, args.root)
