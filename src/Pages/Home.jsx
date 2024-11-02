import React, { useEffect, useRef, useState } from 'react'
import List from '../Components/List'
import {array} from '../assets/GlobalArrays'
import './Home.css'
import Form from '../Components/Form'
import axios from 'axios'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"





const Home = (props) => {
  const PageID = props.currentPage;
  const buttonRef = useRef(null);
  const buttonRef2 = useRef(null); 
  const [pageData,setPageData] = useState("");
  const userID = localStorage.getItem('myData');
  const [fieldData,setFieldData] = useState([]);
  const [flag,setFlag] = useState(false);
  const [isLoading,setLoading] = useState(false);
  
  useEffect(()=>{

    setPageData(array.find(obj => PageID == obj.id ));

  },[PageID]);

  const submitFormData = async(data,fileID) =>{
    buttonRef.current.click();
    
    const newObject = {
      "fileUploaded": fileID
    }
    data.push(newObject);

    try{
      const response = await axios.post(`http://localhost:8000/save/${PageID}`, {data,userID}); 
      getData();
    } catch (err) {
      console.error('Login error:', err);
    }
  }

  async function getData(){

    try{
      const response = await axios.post(`http://localhost:8000/read/${PageID}`, {userID}); 
      setFieldData(response.data);
      setFlag(!flag);

    } catch (err) {
      console.error('Login error:', err);
    }

  }

  async function cancel (fileid){

    setLoading(true);
    (fileid!="" && fileid!=null) ?  await axios.get(`http://localhost:8000/file/${fileid}`) : null;
    setLoading(false);
    
    buttonRef2.current.click();
  };

  return (
    <div className='mainHome' >
        <div className='mainHome1'>Area for charts </div> 
        <div className='mainHome2' >
          
          <div className='mainHome3' >
            <h1 className='titleName text-[#1f1f24] ml-8' >{ pageData.title }</h1>
            <div >
            <AlertDialog>
                <AlertDialogTrigger><button className='btn text-white w-24' >ADD</button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    {/* <AlertDialogTitle> {!isLoading && 'Please fill the required details.'}</AlertDialogTitle> */}
                    <AlertDialogDescription>
                      
                      <Form pageFields={pageData.fields} submitFormData={submitFormData} cancel={cancel}  isLoading={isLoading}   />

                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel  className='hidden' ref={buttonRef2} ></AlertDialogCancel>
                    <AlertDialogAction className='hidden' ref={buttonRef} ></AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          


          <List changeCurrentPage={props.changeCurrentPage} currentPage={props.currentPage} pageFields={pageData.fields} fieldData={fieldData} flag={flag}  />
        
        </div>
    </div>

  )
}

export default Home