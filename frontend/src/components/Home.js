import React, { useState } from 'react'
import Navbar from './Navbar'
import { useNavigate } from 'react-router-dom'

export default function Home() {
    const host="https://papercitation-backend4.onrender.com"
    const [query,setQuery]=useState('')
    const navigate=useNavigate()
    const handlesubmit=(event)=>{
        event.preventDefault();
        // console.log(query)
        localStorage.setItem('query',query)
        sendDataTobackend(query);
    }
    const sendDataTobackend = (query) => {
        fetch(`${host}/api/search_results?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(resp => {
            if (!resp.ok) {
                throw new Error("Network response not found");
            }
            // Handle successful response
            return resp.json();
        })
        .then(data => {
            navigate(`/searchresults/${encodeURIComponent(query)}`);
        })
        .catch(error => {
            console.error("There is a problem:", error);
        });
    }
    
    return (
        <div style={{gap:'2.5em',display:'flex',flexDirection:'column', marginTop:'5em'}}>
            <div className='fs-3 ' style={{textAlign:'center',paddingTop:'0em',justifyContent: 'center',fontWeight:'400'}}>
                Explore relevant papers connected in a visual graph
            </div>
            <div className='fs-5 text-success' style={{textAlign:'center',paddingTop:'0em',justifyContent: 'center'}}>
                To start enter a paper title
            </div>
            <div className="searchclass" style={{ display: 'flex', justifyContent: 'center'}}>
                <form className="d-flex" role="search" id="searchForm">
                    <input className="form-control me-2" type="search" id="searchInput" placeholder="Search by title of any paper" aria-label="Search" style={{ width: "40em" }} onChange={(e)=>setQuery(e.target.value)} />
                    <button className="btn btn-success" type="submit" onClick={handlesubmit}>Build a graph</button>
                </form>
            </div>
        </div>
    )
}
