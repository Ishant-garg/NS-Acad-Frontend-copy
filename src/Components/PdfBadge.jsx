import React, { useEffect, useState } from 'react'
import axios from 'axios'
import PDFViewer from './PDFViewer';
import api from '../utils/api'
import './PDFViewr.css'
import '../utils/api'

const PdfBadge = () => {

    const [pdfData, setPdfData] = useState(null);

    useEffect(() => {
        async function fetchPDF() {
          try {
            const pdfID = localStorage.getItem("fileID");
            const response = await api.get(`/file/view/${pdfID}`);
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