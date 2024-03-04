import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Searchresult() {
    const host = "http://localhost:5000";
    const { query } = useParams();
    const [results, setResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch search results based on query from backend
        fetch(`${host}/api/search_results?query=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response not ok');
                }
                // Parse response as JSON
                return response.json();
            })
            .then(data => {
                // Update results state with fetched data
                setResults(data.data_list);
            })
            .catch(error => console.error('Error:', error));
    }, [query]);

    const handleClick = (pid,e) => {
        e.preventDefault();
        sendDataToBackend(pid);
    };

    const sendDataToBackend = (pid) => {
        fetch(`${host}/api/paper?query=${encodeURIComponent(pid)}`, {
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
            // Navigate to paper page with encoded pid as parameter
            navigate(`/paper/${encodeURIComponent(pid)}`);
        })
        .catch(error => {
            console.error("There is a problem:", error);
        });
    };

    return (
        <div>
            {results.length > 0 ? (
                <div className="card-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1em' }}>
                    {results.map((item, index) => (
                        <div key={index} className="card mb-3" style={{ minWidth: '80em', cursor: 'pointer' }} onClick={(e) => handleClick(item.pid,e)}>
                            <div className="card-body">
                                <h5 className="card-title">{item.title}</h5>
                                <p className="card-text">{item.authors}</p>
                                {/* <a href="#" className="card-link">Card link</a>
                                <a href="#" className="card-link">Another link</a> */}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No search results found</p>
            )}
        </div>
    );
}
