import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';


export default function Similarity(props) {
    const { paperData, info, updateInfo } = props;
    const [graphData, setGraphData] = useState(null);
    const host = "https://papercitation-backend4.onrender.com";
    const [similarity, setsimilarity] = useState({});
    const [similarslider, setslider] = useState(0.00)
    const getYearFromPid = (pid) => {
        if (pid[0] === '9') {
            return '19' + pid.substring(0, 2);
        } else if (pid[0] === '0') {
            return '20' + pid.substring(0, 2);
        }
        // Handle other cases if needed
    };
    const author = (name) => {
        const authorsString = name;
        function extractFirstAuthorName(authorsString) {
            let firstAuthor = '';
            for (let i = 0; i < authorsString.length; i++) {
                if (authorsString[i] === ',' || (authorsString.substring(i, i + 4) === ' and')) {
                    break; // Stop iterating when encountering "," or " and"
                }
                firstAuthor += authorsString[i];
            }
            // Trim any trailing whitespace
            return firstAuthor.trim();
        }

        const firstAuthorName = extractFirstAuthorName(authorsString);
        const [firstAuthorTitle, ...rest] = firstAuthorName.split(' '); // Split the first author's name by space
        const restOfName = rest.join(' ');
        if (restOfName != null) return restOfName;
        return "";
    }
    useEffect(() => {
        const fetchCitationCount = async (seed_pid, pids) => {
            try {
                const response = await fetch(`${host}/api/getsimilarity?seed_pid=${encodeURIComponent(seed_pid)}&pids=${encodeURIComponent(pids)}`);
                if (!response.ok) {
                    throw new Error('Network response not ok');
                }
                const data = await response.json();
                console.log(data);
                setsimilarity(data);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        if (paperData) {
            let seed_pid = paperData.query.pid;
            let pids = paperData.citelist.map(item => item.pid).join(',');
            pids += ',' + paperData.reflist.map(item => item.pid).join(',');
            if (pids[pids.length - 1] === ',') {
                pids = pids.slice(0, -1);
            }

            fetchCitationCount(seed_pid, pids);
        }
    }, [paperData]);

    useEffect(() => {
        if (paperData) {
            // Construct nodes 
            const refNodes = new DataSet(paperData.reflist.map(item => ({ id: item.pid, label: author(item.authors) + " et al." + getYearFromPid(item.pid), label2: item.title, year: getYearFromPid(item.pid) })));

            // Create citNodes DataSet
            const citNodes = new DataSet(paperData.citelist.map(item => ({ id: item.pid, label: author(item.authors) + " et al." + getYearFromPid(item.pid), label2: item.title, year: getYearFromPid(item.pid) })));

            const queryNode = { id: paperData.query.pid, label: author(paperData.query.authors) + " et al." + getYearFromPid(paperData.query.pid), label2: paperData.query.pid, year: getYearFromPid(paperData.query.pid) };

            // Sort refNodes
            const refNodesArray = refNodes.get().sort((a, b) => parseInt(a.year) - parseInt(b.year));
            refNodes.clear();
            refNodes.add(refNodesArray);

            // Sort citNodes
            const citNodesArray = citNodes.get().sort((a, b) => parseInt(a.year) - parseInt(b.year));
            citNodes.clear();
            citNodes.add(citNodesArray);

            // Create nodes DataSet
            const nodes = new DataSet([...refNodesArray, ...citNodesArray, queryNode]);

            // edges
            const citEdges = citNodesArray.map(citNode => ({ from: citNode.id, to: queryNode.id }));
            const refEdges = refNodesArray.map(refNode => ({ from: queryNode.id, to: refNode.id }));
            const edges = new DataSet([...citEdges, ...refEdges]);

            // Set the graph data
            setGraphData({ nodes, queryNode, edges });
        }
    }, [paperData]);
    useEffect(() => {
        if (similarity && paperData) {
            const refNodes = new DataSet(paperData.reflist.map(item => ({
                id: item.pid,
                label: author(item.authors) + " " + getYearFromPid(item.pid) + " (" + parseFloat(similarity[item.pid]).toFixed(3).toString() + ")",
                label2: item.title,
                year: getYearFromPid(item.pid),
            })));

            const citNodes = new DataSet(paperData.citelist.map(item => ({
                id: item.pid,
                label: author(item.authors) + " " + getYearFromPid(item.pid) + " (" + parseFloat(similarity[item.pid]).toFixed(3).toString() + ")",
                label2: item.title,
                year: getYearFromPid(item.pid),
            })));

            const queryNode = {
                id: paperData.query.pid,
                label: author(paperData.query.authors) + " " + getYearFromPid(paperData.query.pid) ,
                label2: paperData.query.pid,
                year: getYearFromPid(paperData.query.pid),
            };

            let nodes = new DataSet([...refNodes.get(), ...citNodes.get(), ...(queryNode ? [queryNode] : [])]);
            if(similarslider!=0){
                nodes = new DataSet(nodes.get().filter(node=>parseFloat(similarity[node.id]).toFixed(2)==similarslider|| node.id === queryNode.id));
            }
            console.log(nodes.get())
            const edges = new DataSet(nodes.get().filter(node => node.id !== queryNode.id).map(node => ({ from: node.id, to: queryNode.id })));

            setGraphData({ nodes,queryNode,edges });

           
        }
    }, [similarity,similarslider]);

    useEffect(() => {
        if (graphData) {
            const container = document.getElementById('graph-container');
            const options = {
                physics: {
                    enabled: true // Disable physics-based layout
                },
                layout: {
                    randomSeed: 2, // Set a specific random seed for consistent random layouts
                },
                nodes: {
                    shape: 'dot',
                    font: {
                        color: 'black'
                    },
                    shadow: true
                }
            };
            const network = new Network(container, graphData, options);
            const { nodes, queryNode, edges } = graphData
            const minYearDifference = 0;
            const maxYearDifference = 5;
            nodes.forEach(node => {
                let Color = 'red'
                let border = 'brown'
                if (info != null && node.id == info.pid) {
                    Color = 'Turquoise'
                }
                if (node != queryNode) {

                    const yearDifference = Math.abs(queryNode.year - node.year);
                    const shade = Math.floor((yearDifference - minYearDifference) / (maxYearDifference - minYearDifference) * 255);
                    // Color = `rgba(0, ${255 - shade}, 0, 1)`; // Shades of green with opacity 0.7
                    // border = 'rgb(0, 150, 0)'

                    if (queryNode.year - node.year > 0) {
                        // If the node is a reference node, shade it with pink
                        Color = `rgba(255, ${300 - shade}, 0, 1)`; // Shades of orange with opacity 1
                    } else {
                        // If the node is not a reference node, shade it with blue
                        Color = `rgba(0, ${255 - shade}, 0, 0.8)`;// Shades of green with opacity 1
                    }
                }
                // Update node color directly
                network.body.nodes[node.id].options.color = {
                    border: '#3E3D53', // Border color remains black for all nodes
                    background: Color, // Set the background color to the calculated green color
                    highlight: {
                        border: 'black' // Border color when highlighted remains black
                    },
                }
                network.on('click', (event) => {
                    const { nodes } = event;
                    if (nodes.length === 1) {
                        const nodeId = nodes[0];
                        const clickedNode = graphData.nodes.get(nodeId);
                        // console.log(clickedNode)

                        const nodeInfo = findNodeInPaperData(clickedNode.id);
                        console.log(nodeInfo)
                        updateInfo(nodeInfo);
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

            });
        }
    }, [graphData]);
    const handleSliderChange = (event) => {
        setslider(parseFloat(event.target.value));
    };

    return (
        <div>
            <div id="graph-container" style={{ border: '1px solid black', height: '32em', marginTop: '1em' }}></div>
            <div style={{ marginTop: '0.5em', width: '100%' }}>
                <label htmlFor="maxNodesSlider">Similarity Score:&nbsp;</label>
                <input
                    type="range"
                    id="maxNodesSlider"
                    min="0.9"
                    max="0.99"
                    step="0.01" 
                    value={similarslider.toFixed(2)}
                    onChange={handleSliderChange}
                    style={{ width: '72%',marginTop:'0.5em' }}
                />
                <span>&nbsp;{similarslider.toFixed(2)}</span>
            </div>
        </div>
    );
    
}
