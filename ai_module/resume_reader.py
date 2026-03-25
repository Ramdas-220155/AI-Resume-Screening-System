import pdfplumber
import docx
import os

def read_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
    return text.lower()

def read_docx(path):
    doc = docx.Document(path)
    return " ".join([p.text for p in doc.paragraphs]).lower()

def read_txt(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read().lower()

def extract_resume_text(path):
    ext = os.path.splitext(path)[1].lower()

    if ext == ".pdf":
        return read_pdf(path)
    elif ext == ".docx":
        return read_docx(path)
    elif ext == ".txt":
        return read_txt(path)
    else:
        raise ValueError("Unsupported format")