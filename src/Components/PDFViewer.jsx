import React from 'react'

const PDFViewer = (props) => {
    const pdfUrl = `data:application/pdf;base64,${props.pdfData}`;
  return (
    <div style={{ width: '100%', height: '600px'}}>
    <iframe
      src={pdfUrl}
      width="100%"
      height="123%"
      title="PDF Viewer"
    />
  </div>
  )
}

export default PDFViewer 