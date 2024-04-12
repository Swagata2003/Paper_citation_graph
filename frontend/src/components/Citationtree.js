import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';


export default function Citationtree(props) {

    const { paperData } = props
    const { info ,updateInfo} = props
    // const [paperData, setPaperData] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [infos, setinfo] = useState(info)
    const [maxNodes, setMaxNodes] = useState(100);
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
        return restOfName;
      }
    useEffect(() => {
        if (paperData) {
            // Construct nodes 
            //   const refNodes = new DataSet(paperData.reflist.map(item => ({ id: item.pid, label: item.pid, label2: item.title, year: getYearFromPid(item.pid), x: 0, y: 0 })));

            // Create citNodes DataSet
            const citNodes = new DataSet(paperData.citelist.map(item => ({ id: item.pid, label: author(item.authors)+" et al."+getYearFromPid(item.pid), label2: item.title, year: getYearFromPid(item.pid), x: 0, y: 0 })));

            const queryNode = { id: paperData.query.pid, label: author(paperData.query.authors)+" et al."+getYearFromPid(paperData.query.pid), label2: paperData.query.pid, year: getYearFromPid(paperData.query.pid), x: 0, y: 0 };

            // Sort refNodes


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

            citNodes.forEach(node => {
                node.x = Math.random() * (maxX - minX) + minX;
                if (queryNode.year != node.year) node.y = -(queryNode.year - node.year) * 100;
                else node.y = 50
            })
            // Create nodes DataSet
            const nodes = new DataSet([ ...citNodes.get(), ...(queryNode ? [queryNode] : [])]);

            console.log(nodes._data)
            // edges
            const citEdges = citNodes.get().map(citNode => ({ from: citNode.id, to: queryNode.id }));

            const edges = new DataSet([...citEdges]);

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
                nodes: {
                    shape:'dot',
                    shadow:true,
                    font: {
                        color: 'black'
                    },
                    // You can adjust the shape of the nodes as desired
                    margin: 5, // Increase the margin for the label
                    labelHighlightBold: false, // Ensures the label outside the node doesn't become bold when highlighted
                    chosen: {
                        label: false // Ensures the label outside the node doesn't become bold when selected
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
            console.log(modnodesarray)

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
                if (info != null && node.id == info.pid) {
                    Color = 'Turquoise'
                }
                if (node != queryNode) {
                    const yearDifference = Math.abs(queryNode.year - node.year);
                    const shade = Math.floor((yearDifference - minYearDifference) / (maxYearDifference - minYearDifference) * 255);
                    // Color = `rgba(0, ${255 - shade}, 0, 1)`; // Shades of green with opacity 0.7
                    // border = 'rgb(0, 150, 0)'
                    Color = `rgba(0, ${255 - shade}, 0, 0.8)`;
                }
                // Update node color directly
                network.body.nodes[node.id].options.color = {
                    border: '#3E3D53', // Border color remains black for all nodes
                    background: Color, // Set the background color to the calculated green color
                    highlight: {
                        border: 'black' // Border color when highlighted remains black
                    },
                }
                // Inside your useEffect after initializing the network


            });

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

                // Search in citelist
                const citNode = paperData.citelist.find(item => item.pid === nodeId);
                if (citNode) return citNode;

                // Search in query
                if (paperData.query.pid === nodeId) return paperData.query;

                return null;
            };

            // Add markings within the graph container
            // renderBarGraph();


        }
    }, [graphData, maxNodes]);
    const handleSliderChange = (event) => {
        setMaxNodes(parseInt(event.target.value));
      };
    return (
        <div>
            <div id="graph-container" style={{ border: '1px solid black', height: '32em', marginTop: '1em' }}></div>
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
    )
}
