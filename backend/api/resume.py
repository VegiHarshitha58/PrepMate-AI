from fastapi import APIRouter, UploadFile, File, HTTPException
import fitz  # PyMuPDF

router = APIRouter(prefix="/api/resume", tags=["Resume"])


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    # Check that the uploaded file is a PDF
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    # Read the uploaded PDF
    contents = await file.read()

    try:
        pdf = fitz.open(stream=contents, filetype="pdf")

        text = ""

        for page in pdf:
            text += page.get_text()

        pdf.close()

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF."
            )

        return {
            "message": "Resume uploaded and text extracted successfully.",
            "filename": file.filename,
            "text": text
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing PDF: {str(e)}"
        )