import React, { useEffect, useState } from 'react';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';
import Chart from 'chart.js/auto';

export default function Yearwise(props) {
    const minyr = 1992;
    const maxyr = 2003;
    const { paperData, info, updateInfo} = props;

    const minYearDifference = 0;
    const maxYearDifference = 5;
    const [graphData, setGraphData] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);

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
            const refNodes = new DataSet(paperData.reflist.map(item => ({ id: item.pid, label: author(item.authors)+" et al."+getYearFromPid(item.pid), label2: item.title, year: getYearFromPid(item.pid) })));

            // Create citNodes DataSet
            const citNodes = new DataSet(paperData.citelist.map(item => ({ id: item.pid, label: author(item.authors)+" et al."+getYearFromPid(item.pid), label2: item.title, year: getYearFromPid(item.pid) })));

            const queryNode = { id: paperData.query.pid, label:author(paperData.query.authors)+" et al."+getYearFromPid(paperData.query.pid), label2: paperData.query.pid, year: getYearFromPid(paperData.query.pid) };

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
        if (graphData) {
            // Initialize a new network
            const container = document.getElementById('graph-container');
            console.log(selectedYear)
            const options = {
                physics: { enabled: true }, // Disable physics-based layout
                layout: { randomSeed: 2 },
                nodes: { 
                    shape:'dot',
              shadow:true,
                    font: { 
                        color: 'black' 
                    } 
                }
            };

            const { nodes, queryNode, edges } = graphData;

            let newNodes = nodes;
            let modEdges = edges;

            if (selectedYear !== null) {
                const filteredNodes = nodes.get().filter(node => parseInt(node.year) === selectedYear || node.id === queryNode.id);
                newNodes = new DataSet(filteredNodes);

                // Filter edges based on selected year
                const filteredEdges = edges.get().filter(edge => {
                    return filteredNodes.some(node => node.id === edge.from || node.id === edge.to);
                });
                modEdges = new DataSet(filteredEdges);
            }

            const newData = {
                nodes: newNodes,
                queryNode,
                edges: modEdges
            };
            console.log(newData)
            const network = new Network(container, newData, options);

            newNodes.forEach(node => {
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
                    border: '#3E3D53',
                    background: Color,
                    highlight: { border: 'black' }
                };
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
    }, [graphData, info, selectedYear]);

    useEffect(() => {
        // Render the bar graph whenever selectedYear changes
        if (graphData) {
            renderBarGraph();
            console.log("Pop")
        }
    }, [graphData]);

    const renderBarGraph = () => {
        const ctx = document.getElementById('bar-chart');
        let barchart=null;
        if (ctx) {
            if (ctx.chart) {
                ctx.chart.destroy(); // Destroy existing chart instance
            }
    
            const allYears = Array.from({ length: maxyr - minyr + 1 }, (_, index) => minyr + index);
            const allNodeCounts = Array(allYears.length).fill(0);
    
            const { nodes, queryNode } = graphData;
            const nodesArray = nodes.get();
    
            nodesArray.forEach(node => {
                const yearIndex = node.year - minyr;
                if (node.id !== queryNode.id) allNodeCounts[yearIndex]++;
            });
    
            const barColors = allNodeCounts.map((count, index) => {
                const year = minyr + index;
                const yearDifference = Math.abs(queryNode.year - year);
                const shade = Math.floor((yearDifference - minYearDifference) / (maxYearDifference - minYearDifference) * 255);
                let color = 'rgba(54, 162, 235, 0.5)'; // Default color
    
                if (queryNode.year - year > 0) {
                    // If the node is a reference node, shade it with pink
                    color = `rgba(255, ${300 - shade}, 0, 1)`
                  } else {
                    // If the node is not a reference node, shade it with green
                    color = `rgba(0, ${255 - shade}, 0, 0.8)`;// Shades of green with opacity 1
                  }
    
                return color;
            });
            console.log(barColors)
    
            barchart=new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: allYears,
                    datasets: [{
                        label: 'Number of Nodes',
                        data: allNodeCounts,
                        backgroundColor: barColors,
                        borderColor: 'grey',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false, // Disable legend display
                        },
                       
                    },
                    scales: {
                        x: { title: { display: true, text: 'Year' } },
                        y: { title: { display: true, text: 'Number of Nodes' }, beginAtZero: true }
                    }
                }
            });
            ctx.onclick = function(event) {
                const activeElement = barchart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false)[0];
                if (activeElement) {
                    const yearIndex = activeElement.index;
                    const selected = minyr + yearIndex;
                    setSelectedYear(selected);
                }
            };
        }
    };
    
    return (
        <div>
            <div id="graph-container" style={{ border: '1px solid black', height: '25em', marginTop: '1em' }}></div>
            <div>
                <canvas id="bar-chart" style={{ marginTop: '1em', minHeight: '10em', cursor: 'pointer' }}></canvas>
            </div>
        </div>
    );
}