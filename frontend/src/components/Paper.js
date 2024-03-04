import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';

export default function Paper() {
    const host = "http://localhost:5000";
    const { query } = useParams();
    const [paperData, setPaperData] = useState(null);
    const [graphData, setGraphData] = useState(null);

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
            const network = new Network(container, graphData, {
                edges: {
                    arrows: {
                        to: true // This specifies that edges should have arrows pointing to the 'to' node
                    }
                },
                layout: {
                    hierarchical: {
                        direction: 'UD', // This specifies the direction of the hierarchical layout (up-down)
                    }
                }
            });
        }
    }, [graphData]);

    return (
        <div>
            <div id="graph-container" style={{ width: '100%', height: '600px' }}></div>
        </div>
    );
}
