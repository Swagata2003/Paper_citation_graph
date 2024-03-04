import React, { useState } from 'react'
import Navbar from './Navbar'
import { useNavigate } from 'react-router-dom'

export default function Home() {
    const host="http://localhost:5000"
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
        <div>
            <div className="searchclass" style={{ display: 'flex', justifyContent: 'center', marginTop: '8em' }}>
                <form className="d-flex" role="search" id="searchForm">
                    <input className="form-control me-2" type="search" id="searchInput" placeholder="Search title name of any paper" aria-label="Search" style={{ width: "40em" }} onChange={(e)=>setQuery(e.target.value)} />
                    <button className="btn btn-outline-success" type="submit" onClick={handlesubmit}>Search</button>
                </form>
            </div>
        </div>
    )
}
