import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from './Loader';

export default function Searchresult() {
    const host = "https://papercitation-backend4.onrender.com";
    const { query } = useParams();
    const [results, setResults] = useState([]);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, [query]);

    const fetchResults = () => {
        setIsLoading(true); // Show loader
        fetch(`${host}/api/search_results?query=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response not ok');
                }
                return response.json();
            })
            .then(data => {
                setResults(data.data_list);
            })
            .catch(error => console.error('Error:', error))
            .finally(() => {
                setTimeout(() => {
                    setIsLoading(false); // Hide loader after 2 seconds
                },200);
            });
    };

    const handleClick = (pid, e) => {
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
        {isLoading ? ( // Display loader if isLoading is true
            <Loader />
        ) : (
            <div>
                {results.length > 0 ? (
                    <>
                        <div className='fs-4' style={{ fontWeight: 500, marginTop: '1em', marginLeft: '5.5em' }}>
                            Choose a paper to build a graph :
                        </div>
                        <div className="card-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1em' }}>
                            {results.map((item, index) => (
                                <div key={index} className="card mb-3" style={{ minWidth: '80em', cursor: 'pointer', border: 'white' }} onClick={(e) => handleClick(item.pid, e)}>
                                    <div className="card-body" style={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 4px' }}>
                                        <h5 className="card-title">{item.title}</h5>
                                        <p className="card-text">{item.authors}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="container" style={{margin:'4em 0em 0em 35em'}}>
                        <h4>No search results found</h4>
                    </div>
                )}
            </div>
        )}
    </div>
    );
}
