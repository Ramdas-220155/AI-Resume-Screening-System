import pdfplumber
import docx
import os


def read_pdf(file_path):

    text = ""

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + " "

    return text


def read_docx(file_path):

    doc = docx.Document(file_path)

    text = ""

    for para in doc.paragraphs:
        text += para.text + " "

    return text


def read_txt(file_path):

    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_resume_text(file_path):

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        return read_pdf(file_path)

    elif extension == ".docx":
        return read_docx(file_path)

    elif extension == ".txt":
        return read_txt(file_path)

    else:
        raise ValueError("Unsupported file format")