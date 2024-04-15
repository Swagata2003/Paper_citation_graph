import React, { useEffect, useState } from 'react';
import { GraphCanvas } from 'reagraph'; // Import GraphCanvas from reagraph
import { useParams } from 'react-router-dom';

export default function Demo() {
    const host = "https://papercitation-backend4.onrender.com";
    const { query } = useParams();
    const [paperData, setPaperData] = useState(null);
    const [info, setinfo] = useState(null);
    const [maxNodes, setMaxNodes] = useState(100);

    useEffect(() => {
        const fetchPaperData = async () => {
            try {
                const response = await fetch(`${host}/api/paper?query=${encodeURIComponent(query)}`);

                if (!response.ok) {
                    throw new Error('Network response not ok');
                }

                const data = await response.json();
                console.log(data);

                setPaperData(data);
                setinfo(data.query);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchPaperData();
    }, [query]);

    return (
        <div style={{ display: 'flex', gap: '1em' }}>
            <div style={{ flex: 1 }}>
                <div className='leftbox' style={{ overflow: 'auto' }}>
                    {/* Query node */}
                    {paperData != null && (
                        <div className="card" style={{ margin: '1em 0em 0em 1em' }}>
                            <h5 className="card-header">Seed Node</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item">
                                    <h6 style={{ color: '#0d0d75' }}>{paperData.query.title}</h6>
                                    <p style={{ color: 'green' }}>{paperData.query.authors}</p>
                                </li>
                            </ul>
                        </div>
                    )}

                    

                    {/* Cited Paper List */}
                    <div className="card" style={{ margin: '1em 0em 0em 1em' }}>
                        <h5 className="card-header">Cited Paper List</h5>
                        <ul className="list-group list-group-flush">
                            {paperData != null && paperData.citelist.length > 0 ? (
                                paperData.citelist.map((item, index) => (
                                    <li key={index} className="list-group-item">
                                        <h6 style={{ color: '#0d0d75' }}>{item.title}</h6>
                                        <p style={{ color: 'green' }}>{item.authors}</p>
                                    </li>
                                ))
                            ) : (
                                <p>No cite result</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
            <div style={{ flex: 2 }}>
                {/* Render GraphCanvas component */}
                {paperData && (
                    <GraphCanvas
                        nodes={[
                            ...paperData.reflist.map(item => ({ id: item.pid, label: item.pid })),
                            ...paperData.citelist.map(item => ({ id: item.pid, label: item.pid })),
                            { id: paperData.query.pid, label: paperData.query.pid }
                        ]}
                        edges={[
                            ...paperData.reflist.map(item => ({ source: paperData.query.pid, target: item.pid })),
                            ...paperData.citelist.map(item => ({ source: item.pid, target: paperData.query.pid }))
                        ]}
                    />
                )}
            </div>
            {/* Info section */}
            {info && (
                <div style={{ width: '30%', marginTop: '1em' }}>
                    <h5><strong>{info.title}</strong></h5>
                    <p>{info.comments}</p>
                    <p><strong>Author:</strong> {info.authors}</p>
                    <p><strong>Journal-ref:</strong> {info.journal}</p>
                    <p><strong>Info:</strong> {info.body}</p>
                </div>
            )}
        </div>
    );
}
