import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import { FaFilePdf } from "react-icons/fa6";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import PdfBadge from './PdfBadge';

  

const List = (props) => {

  const [fields,setFields] = useState([]);
  const [fieldData,setFieldData] = useState([]);
  const userID = localStorage.getItem('myData');
  const PageID = props.currentPage;
  const [Pdf,setPdf] = useState("");

  async function getData(){

    try{
      const response = await axios.post(`http://localhost:8000/read/${PageID}`, {userID}); 
      setFieldData(response.data);

    } catch (err) {
      console.error('Login error:', err);
    }

  }

  useEffect(()=>{
    // console.log(props.fieldData);
    setFieldData(props.fieldData);
  },[props.flag]);

  useEffect(()=>{
    setFields(props.pageFields);
    getData();
  },[props.pageFields]);

  function changePdf (id) {
    setPdf( id[0] );
  }

  return ( 
    <div className='main1' >

      <Table>
        <TableCaption>A list of your recent data.</TableCaption>
        <TableHeader>
          <TableRow>
          <TableHead className="text-center text-base" >S.NO.</TableHead>
            {
              fields ? 
              fields.map((item,index)=>(
                <TableHead className="text-center text-base" >{item[0]}</TableHead>
              )) 
              :
              <TableHead>Loading</TableHead>
            }
            <TableHead className="text-center text-base">Uploaded File</TableHead>
          </TableRow>  
        </TableHeader>
        <TableBody>
          {fieldData ? (
            fieldData.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="text-center h-2" >{index + 1}</TableCell>
                {
                  item.map((item1, index1) => (
                     Object.keys(item1)!='fileUploaded' ?
                       (<TableCell className="text-center h-2" key={index1}>{Object.values(item1)}</TableCell>) :
                       (<TableCell className="text-center h-2" key={index1}>
                          <Dialog>
                            <DialogTrigger className='w-10 h-full' ><FaFilePdf id={Object.values(item1)} className='w-full h-full'  onClick={() => changePdf(Object.values(item1))} /></DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogDescription>
                                  <PdfBadge PdfID={Pdf} />
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                      </TableCell>
                      )
                  ))
                }
              </TableRow>
            ))   
          ) : (
            <TableRow>
              <TableCell colSpan={fields.length + 2}>No data available</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

    </div>
  )
}

export default List