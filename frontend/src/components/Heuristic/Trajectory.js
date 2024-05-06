import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';
import Chart from 'chart.js/auto';
import '../style.css';


export default function Trajectory(props) {
  const host = "https://papercitation-backend4.onrender.com";
  const { paperData } = props
  const { info, updateInfo } = props
  // const [paperData, setPaperData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [infos, setinfo] = useState(info)
  const [maxNodes, setMaxNodes] = useState(100);
  const [maxdata, setmaxdata] = useState([])
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
        const response = await fetch(`${host}/api/getmaxciteyr?query=${encodeURIComponent(str)}`);
        if (!response.ok) {
          throw new Error('Network response not ok');
        }
        const data = await response.json();
        console.log(data);
        setmaxdata(data);
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
    if (paperData) {
      // Construct nodes 
      const refNodes = new DataSet(paperData.reflist.map(item => ({ id: item.pid, label: author(item.authors) + " et al." + getYearFromPid(item.pid), label2: item.title, year: getYearFromPid(item.pid), x: 0, y: 0 })));

      // Create citNodes DataSet
      const citNodes = new DataSet(paperData.citelist.map(item => ({ id: item.pid, label: author(item.authors) + " et al." + getYearFromPid(item.pid), label2: item.title, year: getYearFromPid(item.pid), x: 0, y: 0 })));

      const queryNode = { id: paperData.query.pid, label2: paperData.query.pid, label: author(paperData.query.authors) + " et al." + getYearFromPid(paperData.query.pid), year: getYearFromPid(paperData.query.pid), x: 0, y: 0 };

      const nodes = new DataSet([...refNodes.get(), ...citNodes.get(), ...(queryNode ? [queryNode] : [])]);
      const citEdges = citNodes.get().map(citNode => ({ from: citNode.id, to: queryNode.id }));
      const refEdges = refNodes.get().map(refNode => ({ from: queryNode.id, to: refNode.id }));
      const edges = new DataSet([...citEdges, ...refEdges]);
      setGraphData({ nodes, queryNode, edges });


    }
  }, [paperData])
  useEffect(() => {
    if (graphData) {
      // Initialize a new network
      const container = document.getElementById('graph-container');
      const markingsContainer = document.getElementById('markings-container');
      const options = {
        physics: {
          enabled: true // Disable physics-based layout
        },
        layout: {
          randomSeed: 2, // Set a specific random seed for consistent random layouts
        },
        nodes: {
          font: {
            color: 'black'
          },
          shape: 'dot',
          shadow: true,
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



      const network = new Network(container, graphData, options);

      nodes.forEach(node => {
        let Color = 'red'
        let border = 'brown'
        if (info != null && node.id == info.pid) {
          Color = 'Turquoise'
        }
        if (node != queryNode) {
          console.log(maxdata[node.id] - node.year <= 5, " ")
          if (maxdata[node.id] - node.year <= 5) {
            Color = "Blue"; // Shades of orange with opacity 1
          } else {
            // If the node is not a reference node, shade it with blue
            Color = "Green";// Shades of green with opacity 1
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
        // Inside your useEffect after initializing the network
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
      // renderBarGraph();


    }
  }, [maxdata]);



  return (
    <div>
      <div id="graph-container" style={{ border: '1px solid black', height: '32em', marginTop: '1em' }}></div>
      {/* <canvas id="your-chart-id" style={{display:'absolute'}}></canvas> */}
      <div style={{ display: 'flex',gap:'2em',justifyContent:'center',marginTop:'0.5em' }}>
        <div style={{ display: 'flex' }}>
          <div className="card" style={{ backgroundColor: 'Blue', height: '1.7em', width: '2em' }}>
          </div>
          - Early risers
        </div>
        <div style={{ display: 'flex' }}>
          <div className="card" style={{ backgroundColor: '#028A0F', height: '1.7em', width: '2em' }}>
          </div>
          - Delayed risers
        </div>
      </div>
    </div>
  )
}
