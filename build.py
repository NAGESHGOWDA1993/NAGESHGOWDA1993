from typing import Final, List
import markdown
import os
import shutil
import dataclasses

ROOT: Final = "https://davidbetteridge.net/"

@dataclasses.dataclass(frozen=True)
class BlogEntryDetail:
  content: str
  title: str

@dataclasses.dataclass
class ConversionDetail:
  converter: markdown.Markdown = dataclasses.field(init=False)
  template: str = dataclasses.field(init=False)
  blog_entries: List[str] = dataclasses.field(init=False, default_factory=list)

def markdown_to_html(conversion_detail: ConversionDetail,
                     markdown: str) -> str:
  blog_entries = "\n".join(conversion_detail.blog_entries)
  markdown = markdown.replace("{{entries}}", blog_entries)

  html = conversion_detail.converter.convert(markdown)
  html = conversion_detail.template\
                .replace("{{body}}", html)\
                .replace("{{site.baseurl}}", ROOT)
  return html
                
def convert_file(conversion_detail: ConversionDetail,
                 filename: str,
                 source_folder: str,
                 target_folder: str):
  print(f"Converting {filename}...")
  try:
    with open(f'{source_folder}/{filename}.md', 'r') as f:
      source = f.read()
    html = markdown_to_html(conversion_detail, source)
    with open(f'{target_folder}/{filename}.html', 'w') as f:
      f.write(html)
  except Exception as e:
    print(str(e))

def convert_all_source_files(conversion_detail: ConversionDetail):
  for filename in os.listdir("source_files"):
    without_ext = os.path.splitext(filename)[0]
    convert_file(conversion_detail, without_ext, "source_files", "target_files")


def parse_blog_entry(filename: str, source: str) -> BlogEntryDetail:
  if "START_META" in source:
    end_of_meta = source.find("END_META") + len("END_META") + 1
    meta_section = source[:end_of_meta].split("\n")
    raw = source[end_of_meta: ]
    meta = {d[:loc]:d[loc+2:]
            for d in meta_section
            if (loc := d.find(":")) != -1}
    date = meta.get("DATE","")
    title = meta.get("TITLE","")
    return BlogEntryDetail(raw, f"{date} - {title}")
  else:
    return BlogEntryDetail(source, filename)

def convert_all_blog_posts(conversion_detail: ConversionDetail) -> List[str]:
  links = []
  for filename in os.listdir("blog_posts"):
    try:
      print(f"Converting {filename}...")
      without_ext = os.path.splitext(filename)[0]
    
      with open(f'blog_posts/{without_ext}.md', 'r') as f:
        source = f.read()
        details = parse_blog_entry(without_ext, source)

        html = markdown_to_html(conversion_detail, details.content)
        path = f'target_blog_posts/{without_ext}.html'
        with open(path, 'w') as f:
          f.write(html)
        links.append(f"* [{details.title}](/{path})")
    except Exception as e:
      print(str(e))
  return links

def move_index_html():
  src_path = "target_files/index.html"
  dst_path = "index.html"
  shutil.move(src_path, dst_path)

if __name__ == "__main__":
  conversion_detail = ConversionDetail()
  conversion_detail.converter = markdown.Markdown()
  with open('template.html', 'r') as f:
      conversion_detail.template = f.read()

  conversion_detail.blog_entries = convert_all_blog_posts(conversion_detail)
  convert_all_source_files(conversion_detail)
  move_index_html()
