import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';
export default function Pagerank(props) {
    const { paperData, info ,updateInfo} = props;
    const [graphData, setGraphData] = useState(null);
    const [mincount, setMincount] = useState(0);
    const [pagerank, setpagerank] = useState({});
    const host = "https://papercitation-backend4.onrender.com";

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
        if(restOfName!=null)return restOfName;
    return "";
      }

    useEffect(() => {
        const fetchCitationCount = async (str) => {
            try {
                const response = await fetch(`${host}/api/getpagerank?query=${encodeURIComponent(str)}`);
                if (!response.ok) {
                    throw new Error('Network response not ok');
                }
                const data = await response.json();
                console.log(data);
                setpagerank(data);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        if (paperData) {
            let str = paperData.citelist.map(item => item.pid).join(',');
            str += ',' + paperData.query.pid;
            str += ',' + paperData.reflist.map(item => item.pid).join(',');
            console.log(str);
            fetchCitationCount(str);
        }
    }, [paperData]);

    useEffect(() => {
        if (pagerank.length || paperData) {
            const refNodes = new DataSet(paperData.reflist.map(item => ({
                id: item.pid,
                label: author(item.authors)+" et al."+getYearFromPid(item.pid),
                label2: item.title,
                year: getYearFromPid(item.pid),
            })));

            const citNodes = new DataSet(paperData.citelist.map(item => ({
                id: item.pid,
                label: author(item.authors)+" et al."+getYearFromPid(item.pid),
                label2: item.title,
                year: getYearFromPid(item.pid),
            })));

            const queryNode = {
                id: paperData.query.pid,
                label: author(paperData.query.authors)+" et al."+getYearFromPid(paperData.query.pid),
                label2: paperData.query.pid,
                year: getYearFromPid(paperData.query.pid),
            };

            const allNodes = [...refNodes.get(), ...citNodes.get(), ...(queryNode ? [queryNode] : [])];
            allNodes.sort((a, b) => pagerank[b.id] - pagerank[a.id]); // Sort nodes based on pagerank value
    
            const sortedNodes = allNodes.sort((a, b) => pagerank[b.id] - pagerank[a.id]); // Sort nodes in descending order of pagerank
            const index = sortedNodes.findIndex(node => node.id === queryNode.id);
            if (index !== -1) {
                sortedNodes.splice(index, 1);
            }
            
            // Take the first mincount - 1 nodes (since query node is already included)
            const filteredNodes = sortedNodes.slice(0, mincount - 1);
            
            // Add the query node back to the beginning of the filtered nodes array
            filteredNodes.unshift(queryNode);
            const nodes = new DataSet(filteredNodes);
            
            
            const edges = new DataSet(nodes.get().filter(node => node.id !== queryNode.id).map(node => ({ from: node.id, to: queryNode.id })));
    
            setGraphData({ nodes, queryNode, edges });
        }
    }, [pagerank, mincount]);

    useEffect(() => {
        if (graphData) {
            const container = document.getElementById('graph-container');
            const options = {
                physics: {
                    enabled: true// Disable physics-based layout
                },
                layout: {
                    randomSeed: 2, // Set a specific random seed for consistent random layouts
                },
                nodes: {
                    shape:"dot",
                    shadow:true,
                    font: {
                        color: 'black'
                    }
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
        setMincount(parseInt(event.target.value));
    };

    return (
        <div>
            <div id="graph-container" style={{ border: '1px solid black', height: '32em', marginTop: '1em' }}></div>
            <div style={{ marginTop: '0.5em', width: '100%' }}>
                <label htmlFor="maxNodesSlider">Age rescaled pagerank:</label>
                <input
                    type="range"
                    id="maxNodesSlider"
                    min="0"
                    max="500" // Set max to the maximum citation count among all PIDs if citcount is not empty, otherwise set it to 100
                    value={mincount}
                    onChange={handleSliderChange}
                    style={{ width: '70%' }}
                />
                <span>{mincount}</span>
            </div>
        </div>

    )
}
