import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';
import './style.css';
// import { createDataset } from 'myDatasetLibrary';

export default function Paper() {
    const host = "http://localhost:5000";
    const { query } = useParams();
    const [paperData, setPaperData] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [info, setinfo] = useState(null)
    const [maxNodes, setMaxNodes] = useState(100);

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
            const refNodes = new DataSet(paperData.reflist.map(item => ({ id: item.pid, label: item.pid, label2: item.title, year: getYearFromPid(item.pid), x: 0, y: 0 })));

            // Create citNodes DataSet
            const citNodes = new DataSet(paperData.citelist.map(item => ({ id: item.pid, label: item.pid, label2: item.title, year: getYearFromPid(item.pid), x: 0, y: 0 })));

            const queryNode = { id: paperData.query.pid, label: paperData.query.pid, label2: paperData.query.pid, year: getYearFromPid(paperData.query.pid), x: 0, y: 0 };
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
            const maxX = 400
            const minX = -400
            refNodes.forEach(node => {
                // Modify x and y coordinates as needed\
                node.x = Math.random() * (maxX - minX) + minX;
                if (queryNode.year != node.year) node.y = -(queryNode.year - node.year) * 100;
                else node.y = -50
            });
            citNodes.forEach(node => {
                node.x = Math.random() * (maxX - minX) + minX;
                if (queryNode.year != node.year) node.y = -(queryNode.year - node.year) * 100;
                else node.y = 50
            })
            // Create nodes DataSet
            const nodes = new DataSet([...refNodes.get(), ...citNodes.get(), ...(queryNode ? [queryNode] : [])]);

            console.log(nodes._data)
            // edges
            const citEdges = citNodes.get().map(citNode => ({ from: citNode.id, to: queryNode.id }));
            const refEdges = refNodes.get().map(refNode => ({ from: queryNode.id, to: refNode.id }));
            const edges = new DataSet([...citEdges, ...refEdges]);

            // Set the graph data
            setMaxNodes(nodes.length)
            setGraphData({ nodes, queryNode, edges });
        }
    }, [paperData]);

    useEffect(() => {
        if (graphData && maxNodes) {
            // Initialize a new network
            const container = document.getElementById('graph-container');
            const markingsContainer = document.getElementById('markings-container');
            const options = {
                physics: {
                    enabled: false // Disable physics-based layout
                },
                layout: {
                    randomSeed: 2, // Set a specific random seed for consistent random layouts
                },
                nodes:{
                    font:{
                        color:'black'
                    }
                }

            };
            const minYearDifference = 0;
            const maxYearDifference = 5;
            const { nodes, queryNode, edges } = graphData


            const nodesarray = nodes.get()
            nodesarray.sort((a, b) => {
                const yearDiffA = Math.abs(queryNode.year - a.year);
                const yearDiffB = Math.abs(queryNode.year - b.year);
                return yearDiffA - yearDiffB;
            });
            const queryNodeIndex = nodesarray.findIndex(node => node.id === queryNode.id);


            if (queryNodeIndex !== -1) {
                const queryNodeElement = nodesarray.splice(queryNodeIndex, 1)[0];
                nodesarray.unshift(queryNodeElement);
            }

            const modnodesarray = nodesarray.slice(0, Math.min(nodes.length, maxNodes));
            const newnodes = new DataSet(modnodesarray)

            // Add the sorted items back to refNodes;

            const edgesArray = edges.get();

            // Filter the array to include only those connecting first five nodes
            const filteredEdges = edgesArray.filter(edge => {
                return modnodesarray.some(node => node.id === edge.from || node.id === edge.to);
            });

            // Then, you can convert the filtered array back to a DataSet if needed
            const modedges = new DataSet(filteredEdges);
            const newData = {
                nodes: newnodes,
                queryNode,
                edges: modedges
            };
            const network = new Network(container, newData, options);

            newnodes.forEach(node => {
                let Color = 'red'
                let border = 'brown'
                if (setinfo != null && node.id == setinfo.pid) {
                    Color = 'blue'
                }
                if (node != queryNode) {
                    const yearDifference = Math.abs(queryNode.year - node.year);
                    const shade = Math.floor((yearDifference - minYearDifference) / (maxYearDifference - minYearDifference) * 255);
                    Color = `rgba(0, ${255 - shade}, 0, 1)`; // Shades of green with opacity 0.7
                    border = 'rgb(0, 150, 0)'
                }
                // Update node color directly
                network.body.nodes[node.id].options.color = {
                    border: 'black', // Border color remains black for all nodes
                    background: Color, // Set the background color to the calculated green color
                    highlight: {
                        border: 'black' // Border color when highlighted remains black
                    },
                }
                // let nd=network.body.nodes[node.id]
                // nd.setOptions({
                //     font: {
                //       color: Color> 170?'black':'white'
                //     }
                //   });
                // network.body.nodes[node.id].options.label = `<div style="position: relative; top: -20px;">${node.label}</div>`;

            });

            network.on('click', (event) => {
                const { nodes } = event;
                if (nodes.length === 1) {
                    const nodeId = nodes[0];
                    const clickedNode = graphData.nodes.get(nodeId);
                    // console.log(clickedNode)

                    const nodeInfo = findNodeInPaperData(clickedNode.id);
                    console.log(nodeInfo)
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

            // Add markings within the graph container


        }
    }, [graphData, maxNodes]);

    const handleSliderChange = (event) => {
        setMaxNodes(parseInt(event.target.value));
    };

    return (
        <div style={{ display: 'flex', maxHeight: '40em', gap: '1em' }}>
            <div className='leftbox' style={{ flex: 1.25, overflow: 'auto' }}>
                {/* query node */}
                {paperData != null && (<div className="card" style={{ margin: '1em 0em 0em 1em' }} >
                    <h5 className="card-header">
                        Seed Node
                    </h5>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item">
                            <h6 style={{ color: '#0d0d75' }}>{paperData.query.title.length <= 35 ? paperData.query.title : paperData.query.title.substring(0, 32) + '...'}</h6>
                            <p style={{ color: 'green' }}>{paperData.query.authors}</p>
                        </li>
                    </ul>
                </div>)}
                {/*  */}

                <div className="card" style={{ margin: '1em 0em 0em 1em' }}>
                    <h5 className="card-header">
                        Reference Paper List
                    </h5>
                    <ul className="list-group list-group-flush">
                        {paperData != null && paperData.reflist.length > 0 ? (
                            paperData.reflist.map((item, index) => (
                                <li key={index} className="list-group-item">
                                    <h6 style={{ color: '#0d0d75' }}>
                                        {item.title.length <= 35 ? item.title : item.title.substring(0, 32) + '...'}
                                    </h6>
                                    <p style={{ color: 'green' }}>{item.authors}</p>
                                </li>
                            ))
                        ) : (
                            <p>No ref result</p>
                        )}
                    </ul>
                </div>



                <div className="card" style={{ margin: '1em 0em 0em 1em' }} >
                    <h5 className="card-header">
                        Cited Paper List
                    </h5>
                    <ul className="list-group list-group-flush">
                        {paperData != null && paperData.citelist.length > 0 ? (
                            paperData.citelist.map((item, index) => (
                                <li key={index} className="list-group-item">
                                    <h6 style={{ color: '#0d0d75' }}>{item.title.length <= 35 ? item.title : item.title.substring(0, 32) + '...'}</h6>
                                    <p style={{ color: 'green' }}>{item.authors}</p>
                                </li>
                            )))
                            : (
                                <p>No cite result</p>
                            )}


                    </ul>
                </div>

            </div>
            <div style={{ flex: 3, position: 'relative' }}>
                <div id="graph-container" style={{ border: '1px solid black', height: '37em', marginTop: '1em' }}></div>
                <div style={{ marginTop: '0.5em', width: '100%' }}>
                    <label htmlFor="maxNodesSlider">Max Nodes:</label>
                    <input
                        type="range"
                        id="maxNodesSlider"
                        min="1"
                        max="500" // Set your desired maximum limit
                        value={maxNodes}
                        onChange={handleSliderChange}
                        style={{ width: '80%' }}
                    />
                    <span>{maxNodes}</span>
                </div>
            </div>

            {
                info != null && (
                    <div style={{ width: '30%', marginTop: '1em' }}>
                        <h5><strong>{info.title != null ? info.title : ' '}</strong></h5>
                        <p>{info.comments != null ? info.comments : ' '}</p>
                        <p><strong>Author:</strong>{info.authors != null ? info.authors : ' '}</p>
                        <p><strong>Journal-ref:</strong>{info.journal != null ? info.journal : ' '}</p>
                        <p><strong>Info:</strong>{info.body != null ? info.body : ' '}</p>
                    </div>
                )
            }
        </div >
    );
}
