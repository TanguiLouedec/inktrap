"""Rebuilds the test fonts in this folder from the upstream Google Fonts files.

    pip install fonttools brotli
    python build.py <dir>

<dir> must contain, from https://github.com/google/fonts/tree/main/ofl:
  Fraunces[SOFT,WONK,opsz,wght].ttf, Fraunces-Italic[SOFT,WONK,opsz,wght].ttf  (ofl/fraunces)
  SpaceGrotesk[wght].ttf                                                     (ofl/spacegrotesk)

Both fonts are under the SIL Open Font License 1.1 without Reserved Font Names, so these
modified versions keep their names. Modifications, all for testing:
  - subset to Basic Latin, keeping every layout feature and name record;
  - Fraunces: name ID 9 (designer, from Google Fonts' METADATA.pb) added, and ss01 given a
    UI name ("Test set name") so feature-name parsing is covered;
  - Space Grotesk: pinned to a static Bold instance (wght 700).
"""

import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import otTables
from fontTools.varLib.instancer import instantiateVariableFont

src = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
BASIC_LATIN = "".join(chr(c) for c in range(0x20, 0x7F))


def subsetted(font):
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.drop_tables += ["DSIG"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=BASIC_LATIN)
    subsetter.subset(font)
    return font


def fraunces(name, out, flavor):
    font = subsetted(TTFont(os.path.join(src, name)))
    names = font["name"]
    names.setName("Undercase Type, Phaedra Charles, Flavia Zimbardi", 9, 3, 1, 0x409)
    ui_name = names.addMultilingualName({"en": "Test set name"}, ttFont=font, minNameID=256)
    for record in font["GSUB"].table.FeatureList.FeatureRecord:
        if record.FeatureTag == "ss01":
            params = otTables.FeatureParamsStylisticSet()
            params.Version = 0
            params.UINameID = ui_name
            record.Feature.FeatureParams = params
    font.flavor = flavor
    font.save(os.path.join(here, "fraunces", out))


def space_grotesk_bold():
    font = TTFont(os.path.join(src, "SpaceGrotesk[wght].ttf"))
    font = instantiateVariableFont(font, {"wght": 700}, updateFontNames=True)
    font = subsetted(font)
    font.flavor = "woff"
    font.save(os.path.join(here, "space-grotesk", "SpaceGrotesk-Bold.woff"))


os.makedirs(os.path.join(here, "fraunces"), exist_ok=True)
os.makedirs(os.path.join(here, "space-grotesk"), exist_ok=True)
fraunces("Fraunces[SOFT,WONK,opsz,wght].ttf", "Fraunces-Roman-VF.ttf", None)
fraunces("Fraunces-Italic[SOFT,WONK,opsz,wght].ttf", "Fraunces-Italic-VF.woff2", "woff2")
space_grotesk_bold()
