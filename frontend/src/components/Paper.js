import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';
import './style.css';

export default function Paper() {
    const host = "http://localhost:5000";
    const { query } = useParams();
    const [paperData, setPaperData] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [info, setinfo] = useState(null)

    const getYearFromPid = (pid) => {
        if (pid[0] === '9') {
            return '19' + pid.substring(0, 2);
        } else if (pid[0] === '0') {
            return '20' + pid.substring(0, 2);
        }
        // Handle other cases if needed
    };

    // Sort function to arrange nodes based on the year extracted from their IDs
    const sortNodesByYear = (a, b) => {
        const yearA = getYearFromPid(a[0]);
        const yearB = getYearFromPid(b[0]);
        return yearA.localeCompare(yearB);
    };

    useEffect(() => {
        const fetchPaperData = async () => {
            try {
                // Fetch paper data based on the query from the backend
                const response = await fetch(`${host}/api/paper?query=${encodeURIComponent(query)}`);

                if (!response.ok) {
                    throw new Error('Network response not ok');
                }

                // Parse response as JSON
                const data = await response.json();
                console.log(data);

                // Update paperData state with fetched data
                setPaperData(data);
                setinfo(data.query);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchPaperData();
    }, [query]);

    useEffect(() => {
        if (paperData) {
            // Construct nodes 
            const refNodes = new DataSet(paperData.reflist.map(item => ({ id: item.pid, label: item.pid, label2: item.title, year: getYearFromPid(item.pid) })));

            // Create citNodes DataSet
            const citNodes = new DataSet(paperData.citelist.map(item => ({ id: item.pid, label: item.pid, label2: item.title, year: getYearFromPid(item.pid) })));

            const queryNode = { id: paperData.query.pid, label: paperData.query.pid, label2: paperData.query.pid };
            console.log(Array.from(refNodes._data))
            console.log(Array.from(citNodes._data))
            // Sort refNodes
            const refNodesArray = refNodes.get();

            // Sort refNodesArray
            refNodesArray.sort((a, b) => {
                const yearA = parseInt(a.year);
                const yearB = parseInt(b.year);
                return yearA - yearB;
            });

            refNodes.clear();

            // Add the sorted items back to refNodes
            refNodesArray.forEach(item => refNodes.add(item));

            // Sort citNodes
            const citNodesArray = citNodes.get();

            // Sort citNodesArray
            citNodesArray.sort((a, b) => {
                const yearA = parseInt(a.year);
                const yearB = parseInt(b.year);
                return yearA - yearB;
            });
            citNodes.clear();

            // Add the sorted items back to refNodes
            citNodesArray.forEach(item => citNodes.add(item));


            // Create nodes DataSet
            const nodes = new DataSet([...refNodes.get(), ...citNodes.get(), ...(queryNode ? [queryNode] : [])]);

            console.log(nodes._data)
            // edges
            const citEdges = citNodes.get().map(citNode => ({ from: citNode.id, to: queryNode.id }));
            const refEdges = refNodes.get().map(refNode => ({ from: queryNode.id, to: refNode.id }));
            const edges = new DataSet([...citEdges, ...refEdges]);

            // Set the graph data
            setGraphData({ nodes, edges });
        }
    }, [paperData]);

    useEffect(() => {
        if (graphData) {
            // Initialize a new network
            const container = document.getElementById('graph-container');
            const options = {
                edges: {
                    arrows: {
                        to: true // This specifies that edges should have arrows pointing to the 'to' node
                    }
                },
                layout: {
                    hierarchical: {
                        direction: 'DU', // This specifies the direction of the hierarchical layout (up-down)
                        sortMethod: 'directed', // Arrange nodes according to the direction of the edges
                        // Adjust spacing between nodes
                        levelSeparation: 200, // Adjust separation between levels
                    }
                }
            };

            const network = new Network(container, graphData, options);
            network.on('click', (event) => {
                const { nodes } = event;
                if (nodes.length === 1) {
                    const nodeId = nodes[0];
                    const clickedNode = graphData.nodes.get(nodeId);
                    
                    // Search for clicked node's ID in paperData
                    const nodeInfo = findNodeInPaperData(clickedNode.id);
                    setinfo(nodeInfo);
                }
            });
            const findNodeInPaperData = (nodeId) => {
                // Search in reflist
                const refNode = paperData.reflist.find(item => item.pid === nodeId);
                if (refNode) return refNode;
            
                // Search in citelist
                const citNode = paperData.citelist.find(item => item.pid === nodeId);
                if (citNode) return citNode;
            
                // Search in query
                if (paperData.query.pid === nodeId) return paperData.query;
            
                return null;
            };
        }
    }, [graphData]);

    return (
        <div style={{ display: 'flex', maxHeight: '40em' }}>
            <div className='leftbox' style={{ flex: 1.25, overflow: 'auto' }}>
                {/* query node */}
                {paperData != null && (<div className="card" style={{ margin: '1em 0em 0em 1em' }} >
                    <h5 className="card-header">
                        Seed Node
                    </h5>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item">
                        <h6 style={{color:'#0d0d75'}}>{paperData.query.title.length<=35?paperData.query.title:paperData.query.title.substring(0, 32)+'...'}</h6>
                        <p style={{color:'green'}}>{paperData.query.authors}</p>
                        </li>
                    </ul>
                </div>)}
                {/*  */}
                {paperData != null && paperData.reflist.length > 0 ? (
                    <div className="card" style={{ margin: '1em 0em 0em 1em' }} >
                        <h5 className="card-header">
                            Reference Paper List
                        </h5>
                        <ul className="list-group list-group-flush">
                            {paperData.reflist.map((item, index) => (
                                <li key={index} className="list-group-item">
                                    <h6 style={{color:'#0d0d75'}}>{item.title.length <= 35 ? item.title : item.title.substring(0, 32) + '...'}</h6>
                                    <p style={{color:'green'}}>{item.authors}</p>
                                </li>
                            ))

                            }
                        </ul>
                    </div>

                ) : (
                    <p>No ref result</p>
                )
                }
                
                {paperData != null && paperData.citelist.length > 0 ? (
                    <div className="card" style={{ margin: '1em 0em 0em 1em' }} >
                    <h5 className="card-header">
                        Cited Paper List
                    </h5>
                    <ul className="list-group list-group-flush">
                        {paperData.citelist.map((item, index) => (
                            <li key={index} className="list-group-item">
                                <h6 style={{color:'#0d0d75'}}>{item.title.length <= 35 ? item.title : item.title.substring(0, 32) + '...'}</h6>
                                <p style={{color:'green'}}>{item.authors}</p>
                            </li>
                        ))

                        }
                    </ul>
                </div>

                ) : (
                    <p>No cite result</p>
                )

                }
            </div>
            <div id="graph-container" style={{ width: '100%', height: '600px', flex: 3 }}></div>
            {info != null && (
                <div className='rightbox' style={{ flex: 1.5,borderLeft: '1px solid #ccc' }}>
                    <div style={{margin:'1em 0.5em 0em 1em'}}>
                        <h5><strong>{info.title != null ? info.title : ' '}</strong></h5>
                        <p><strong>Author:</strong>{info.authors != null ? info.authors : ' '}</p>
                        <p><strong>Info:</strong>{info.body != null ? info.body : ' '}</p>
                    </div>
                </div>
            )
            }
        </div>
    );
}
