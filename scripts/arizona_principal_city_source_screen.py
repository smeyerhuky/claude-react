"""Check Arizona principal-city source work; never approve driving access."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch

FOLDER = Path('docs/research/arizona-principal-city-sources')
PUBLISHERS = {
    '0410530': ('casa-grande', 'casagrandeaz.gov'),
    '0412000': ('chandler', 'www.chandleraz.gov'),
    '0420050': ('douglas', 'douglasaz.gov'),
    '0423620': ('flagstaff', 'flagstaff.az.gov'),
    '0427400': ('gilbert', 'www.gilbertaz.gov'),
    '0437620': ('kingman', 'www.explorekingman.com'),
    '0439370': ('lake-havasu-city', 'www.lhcaz.gov'),
    '0446000': ('mesa', 'www.mesaartscenter.com'),
    '0455000': ('phoenix', 'recorder.maricopa.gov'),
    '0457380': ('prescott', 'prescott-az.gov'),
    '0457450': ('prescott-valley', 'www.prescottvalley-az.gov'),
    '0465000': ('scottsdale', 'www.scottsdaleaz.gov'),
    '0466820': ('sierra-vista', 'www.sierravistaaz.gov'),
    '0473000': ('centercity-tempe', 'www.tempe.gov'),
    '0485540': ('yuma', 'www.visityuma.com'),
}


def check(root=ROOT):
    return check_batch('AZ', FOLDER, PUBLISHERS, retained={
        '0477000': dict(path='docs/research/tucson-parking-publication/visitor-excerpts.json',
                       schema='tucson-parking-publication-excerpts-v1', host='www.tucsonaz.gov',
                       false_flags=['entry_path_verified'])}, root=root)


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
