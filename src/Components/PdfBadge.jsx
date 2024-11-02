import React, { useEffect, useState } from 'react'
import axios from 'axios'
import PDFViewer from './PDFViewer';
import './PDFViewr.css'

const PdfBadge = (props) => {

    const [pdfData, setPdfData] = useState(null);

    useEffect(() => {
        async function fetchPDF() {
          try {
            const pdfID = props.PdfID;
            const response = await axios.get(`http://localhost:8000/file/view/${pdfID}`);
            setPdfData(response.data.pdfData);
          } catch (error) {
            console.error('Error fetching PDF:', error);
          }
        }
        fetchPDF();
      }, []);

  return (
    <div>
      {pdfData ? (
        <PDFViewer pdfData={pdfData} />
      ) : (
        <div className="loader-container">
            <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}
 
export default PdfBadge