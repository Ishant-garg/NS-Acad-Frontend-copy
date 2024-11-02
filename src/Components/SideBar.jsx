import React, { useEffect, useState } from 'react'
import './SideBar.css'
import axios from 'axios'
import { IoPersonCircle } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { MdLogout } from "react-icons/md";

const SideBar = (props) => {

    const userID = localStorage.getItem('myData');
    // const [name,setName] = useState("");
    // const [hovered,setHovered] = useState(false);

    function changeCurrentPageState (e){
        props.changeCurrentPage(e.target.id);
    }

    // useEffect(()=>{
 
    //     async function getUserData(){
    //         const response = await axios.get(`http://localhost:8000/read/${userID}`);
    //         setName(response.data);  
    //     }
    //     getUserData();

    // },[userID,name])
    // const changeHover = () =>{
    //     setHovered(!hovered);
    // }

  return (
    <div className='main' >

        <div className="mainChild1">
            <img src="../../file.png" alt="logo" />
        </div>

        <div className='mainChild2' >
            <div className="collapse collapse-arrow ">
            <input type="radio" name="my-accordion-2" defaultChecked />  
            <div className="collapse-title text-xl  font-medium">
                Self Appraisal
            </div>
            <div className="collapse-content"> 
                <ul>
                    <li><div id='c4e293e9-1f5c-4edd-a3e5-fa0dfc23e566' onClick={(event)=>changeCurrentPageState(event)} >Teacher Training through SWAYAM portal</div></li>
                    <li><div id='2544a712-bd7d-46ee-8ca8-12c51f8bed35' onClick={(event)=>changeCurrentPageState(event)} >Details of FDPs</div></li>
                    <li><div id='71bcb869-24e1-4729-af2f-1dc0bdb37160' onClick={(event)=>changeCurrentPageState(event)} >MOOCS course completed with E-Certification</div></li>
                    <li><div id='4d6f5dca-b6e6-46dc-aa2b-f3cfd7cfa99c' onClick={(event)=>changeCurrentPageState(event)} >Industrial Training undertaken</div></li>
                    <li><div id='d2d32dbb-a6cc-458e-8110-61f192f06163' onClick={(event)=>changeCurrentPageState(event)} >Research publications</div></li>
                    <li><div id='100f2f8f-e4e1-4baa-a991-c8e488a12bfb' onClick={(event)=>changeCurrentPageState(event)} >PhD students guided</div></li>
                    <li><div id='e335269e-e824-41c7-a7f8-dfe32ad563f0' onClick={(event)=>changeCurrentPageState(event)} >Patent published/granted</div></li>
                    <li><div id='2a15c929-294c-4e8c-a145-5f5a207c3acf' onClick={(event)=>changeCurrentPageState(event)} >Details of Research Projects</div></li>
                    <li><div id='593cc266-6e28-4db4-a865-989aa89347e1' onClick={(event)=>changeCurrentPageState(event)} >Details ofMOOCs/e-content developed</div></li>
                </ul>
            </div>
            </div>
            {/* ///////////////////////////////////////////////////// */}
            <div className="collapse collapse-arrow ">
            <input type="radio" name="my-accordion-2" /> 
            <div className="collapse-title text-xl  font-medium">
                360* FeedBack 
            </div>
            <div className="collapse-content"> 
            <ul>
                    <li><div id='ea758c6c-89aa-4223-9e3c-f053674bdaa7' onClick={(event)=>changeCurrentPageState(event)} >Teaching Process</div></li>
                    <li><div id='ef8b0c79-3799-4ba0-b5af-7f23516572c1' onClick={(event)=>changeCurrentPageState(event)} >Students' Feedback </div></li>
                    <li><div id='e2cd5bc7-a86a-41d1-8417-0322cec89540' onClick={(event)=>changeCurrentPageState(event)} >Departmental Activities</div></li>
                    <li><div id='6ee8ce30-1266-4412-8e43-4721aa4ce401' onClick={(event)=>changeCurrentPageState(event)} >University/Campus Activities</div></li>
                    <li><div id='36d33aa9-baab-41cd-87c3-43c16f57789b' onClick={(event)=>changeCurrentPageState(event)} >ACR maintained at institute level</div></li>
                    <li><div id='36d33aa9-baab-41cd-87c3-43c16f59989b' onClick={(event)=>changeCurrentPageState(event)} >Contribution to Society</div></li>
                </ul>
            </div>
            </div>
            {/* ///////////////////////////////////////////////////// */}
            <div className="collapse collapse-arrow ">
            <input type="radio" name="my-accordion-2" /> 
            <div className="collapse-title text-xl  font-medium">
                Category 3
            </div>
            <div className="collapse-content"> 
            <ul>
                    <li><div id='c70afe60-c3cc-4ade-9369-137ffee0221d' onClick={(event)=>changeCurrentPageState(event)} >Books</div></li>
                    <li><div id='41b0275c-1217-4dd6-a897-d1dad2ec19b1' onClick={(event)=>changeCurrentPageState(event)} >Book Chapter</div></li>
                    <li><div id='58ee31b4-bcd0-4152-84ee-d20541655d4c' onClick={(event)=>changeCurrentPageState(event)} >Journals</div></li>
                    <li><div id='d4a4b731-0366-42cf-91d8-af45ce1e5c79' onClick={(event)=>changeCurrentPageState(event)} >Conferences</div></li>
                    <li><div id='5c97fdc9-12a4-4551-af1c-b9962e962be3' onClick={(event)=>changeCurrentPageState(event)} >Mtech Project</div></li>
                    <li><div id='5f7b6f6d-fc1a-4086-85ff-adc1c3a4ffd7' onClick={(event)=>changeCurrentPageState(event)} >Btech Project</div></li>
                    <li><div id='08f9f04e-eb8e-4a10-9779-e2c93f10c8bd' onClick={(event)=>changeCurrentPageState(event)} >PHD scholars</div></li>
                    <li><div id='0f881caa-141c-457a-9489-48a22edfedda' onClick={(event)=>changeCurrentPageState(event)} >Faculty development Programs</div></li>
                </ul>
            </div>
            </div>
            {/* ///////////////////////////////////////////////////// */}
            <div className="collapse collapse-arrow ">
            <input type="radio" name="my-accordion-2" /> 
            <div className="collapse-title text-xl  font-medium">
                Category 4
            </div>
            <div className="collapse-content"> 
            <ul>
                    <li><div id='bb086f1f-cf83-4c01-a0e5-094e0c82b8e3' onClick={(event)=>changeCurrentPageState(event)} >Short term courses</div></li>
                    <li><div id='88b02c4d-8cea-4344-b1de-d57b05d823b4' onClick={(event)=>changeCurrentPageState(event)} >Project Grant</div></li>
                    <li><div id='43e0a50c-6907-4e0a-9306-961b1fbefde4' onClick={(event)=>changeCurrentPageState(event)} >Consultancy Projects</div></li>
                    <li><div id='7a34b790-37a7-4f0e-a8e6-057d000c3529' onClick={(event)=>changeCurrentPageState(event)} >Patent</div></li>
                    <li><div id='c80c883d-60e5-4715-bce4-5a875dc42f27' onClick={(event)=>changeCurrentPageState(event)} >Invited Talk</div></li>
                    <li><div id='757a442d-0c95-41f4-ab3b-1fb80676ec49' onClick={(event)=>changeCurrentPageState(event)} >Society Membership</div></li>
                    <li><div id='ec5c1827-0dd3-498b-be5c-8d12b53b75cd' onClick={(event)=>changeCurrentPageState(event)} >Teaching Duty</div></li>
                    <li><div id='b6b8e826-68e1-4a34-8744-3f729db9204e' onClick={(event)=>changeCurrentPageState(event)} >Material Consulted</div></li>
                </ul>
            </div>
            </div>
            {/* ///////////////////////////////////////////////////// */}
        </div>
                    

                    


    </div>
  )
}

export default SideBar