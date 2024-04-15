import React from 'react'

export default function Navbar() {
    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">

                    
                    <a className="navbar-brand d-flex" href="#" style={{gap:'1em'}}>
                    <img src="https://cdn-icons-png.flaticon.com/256/957/957642.png" alt="" style={{width:'1.7em'}}/>
                        <h4>R<sup>4</sup> LitGraphs : Retrieve Readable and Relevant Graphs For Roadmapping Literature Review </h4></a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    
                </div>
            </nav>
        </div>
    )
}
