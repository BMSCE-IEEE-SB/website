import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

p = Path(r"c:\Users\goels\Downloads\Ieee website .docx")
with zipfile.ZipFile(p) as z:
    comments = z.read("word/comments.xml")
    doc = z.read("word/document.xml")
    rels = z.read("word/_rels/document.xml.rels")

root = ET.fromstring(comments)
print("=== COMMENTS ===")
for c in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}comment"):
    cid = c.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}id")
    author = c.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}author")
    texts = [t.text or "" for t in c.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")]
    joined = " ".join(texts)
    print(f"[{cid}] {author}: {joined}")

print()
print("=== DOCUMENT STRUCTURE ===")
droot = ET.fromstring(doc)
rroot = ET.fromstring(rels)
rid_map = {}
for rel in rroot:
    rid_map[rel.get("Id")] = rel.get("Target")

for el in droot.iter():
    tag = el.tag.split("}")[-1]
    if tag == "t" and el.text and el.text.strip():
        print("TEXT:", el.text.strip()[:240])
    if tag == "commentRangeStart":
        print("COMMENT START", dict(el.attrib))
    if tag == "commentRangeEnd":
        print("COMMENT END", dict(el.attrib))
    if "blip" in el.tag.lower() or tag == "blip":
        embed = None
        for k, v in el.attrib.items():
            if "embed" in k:
                embed = v
        print("IMAGE", embed, "->", rid_map.get(embed, embed))
