import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DataSet } from 'vis-data/peer';
import { Network } from 'vis-network/peer';
import Chart from 'chart.js/auto';
import Layercitaiongraph from './Layercitaiongraph';
import './style.css';
import Yearwise from './Yearwise';
import Citationcount from './Heuristic/Citationcount';
import Range from './Heuristic/Range';
import Trajectory from './Heuristic/Trajectory';
import Referencetree from './Referencetree';
import Citationtree from './Citationtree';
import Pagerank from './Pagerank';
import Loader from './Loader';
import Similarity from './Similarity';
// import { createDataset } from 'myDatasetLibrary';

export default function Paper() {
    const host = "https://papercitation-backend4.onrender.com";
    const { query } = useParams();
    const [paperData, setPaperData] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [info, setinfo] = useState(null)
    const [maxNodes, setMaxNodes] = useState(100);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState('layer');

    let barchart1=null;
    let barchart2=null;
    const minyr = 1992;
    const maxyr = 2003;

    const minYearDifference = 0;
    const maxYearDifference = 5;

    const getYearFromPid = (pid) => {
        if (pid[0] === '9') {
            return '19' + pid.substring(0, 2);
        } else if (pid[0] === '0') {
            return '20' + pid.substring(0, 2);
        }
        // Handle other cases if needed
    };

    // Sort function to arrange nodes based on the year extracted from their IDs

    const handleRadioChange = (event) => {
        setSelectedOption(event.target.value);
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
            }finally {
                
                    setIsLoading(false); // Hide loader
                
                
            }
        };

        fetchPaperData();
    }, [query]);
    const updateInfo = (newInfo) => {
        setinfo(newInfo);
    };



    return (
        <div>
        {isLoading ? ( // Display loader if isLoading is true
            <Loader />
        ) : (
            <div>
                 <div>
            <div className='checkbox' style={{
                     display: 'flex',
                     flexDirection: 'row',
                     justifyContent:'center',
                     
                     gap:'2.25em',
                    top: '0em',
                    right: '10px',
                    backgroundColor: '#fff',
                    padding: '10px',
                    borderRadius: '5px',
                    boxShadow: '0px -2px 4px rgba(0,0,0,0.2), 0px 2px 4px rgba(0,0,0,0.2)'
                }}>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="graphType"
                            id="layerRadio"
                            value="layer"
                            checked={selectedOption === 'layer'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="layerRadio">
                            Default
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="graphType"
                            id="referenceRadio"
                            value="referencetree"
                            checked={selectedOption === 'referencetree'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="referenceRadio">
                            Prior works
                        </label>
                    </div>

                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="graphType"
                            id="citationRadio"
                            value="citationtree"
                            checked={selectedOption === 'citationtree'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="citationRadio">
                            Derivative works
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="graphType"
                            id="yearRadio"
                            value="year"
                            checked={selectedOption === 'year'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="yearRadio">
                            Year-wise
                        </label>
                    </div>

                    {/* Heuristic button with three radio buttons */}
                    

                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="heuristicType"
                            id="citationCountRadio"
                            value="citationCount"
                            checked={selectedOption === 'citationCount'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="citationCountRadio">
                            Citation Count
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="heuristicType"
                            id="rangeRadio"
                            value="range"
                            checked={selectedOption === 'range'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="rangeRadio">
                            IQR
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="heuristicType"
                            id="trajectoryRadio"
                            value="trajectory"
                            checked={selectedOption === 'trajectory'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="trajectoryRadio">
                            Trajectory
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="graphType"
                            id="pagerankRadio"
                            value="pagerank"
                            checked={selectedOption === 'pagerank'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="pagerankRadio">
                        Age-rescaled PageRank
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="graphType"
                            id="similarityRadio"
                            value="similarity"
                            checked={selectedOption === 'similarity'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="similarityRadio">
                        Similarity Score
                        </label>
                    </div>
                    {/* <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="graphType"
                            id="auhtorRadio"
                            value="layer"
                            checked={selectedOption === 'author'}
                            onChange={handleRadioChange}
                        />
                        <label className="form-check-label" htmlFor="authorRadio">
                            Author impact
                        </label>
                    </div> */}
            </div>
            <div style={{ display: 'flex', maxHeight: '40em', gap: '1em' }}>
                <div className='leftbox' style={{ flex: 1.8, overflow: 'auto' }}>
                    {/* query node */}
                    {paperData != null && (<div className="card" style={{ margin: '1em 0em 0em 1em' }} >
                        <h5 className="card-header">
                            Origin Paper
                        </h5>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item" style={{ cursor: 'pointer' }} onClick={() => updateInfo(paperData.query)}>
                                <h6 style={{ color: '#0d0d75' }}>{paperData.query.title.length <= 35 ? paperData.query.title : paperData.query.title.substring(0, 32) + '...'}</h6>
                                <p style={{ color: 'green' }}>{paperData.query.authors}</p>
                            </li>
                        </ul>
                    </div>)}
                    {/*  */}

                    <div className="card" style={{ margin: '1em 0em 0em 1em' }}>
                        <h5 className="card-header">
                            Connected papers
                        </h5>
                        <ul className="list-group list-group-flush">
                            {paperData != null && paperData.reflist.length > 0 ? (
                                paperData.reflist.map((item, index) => (
                                    <li key={index} className="list-group-item" style={{ cursor: 'pointer' }} onClick={() => updateInfo(paperData.reflist[index])}>
                                        <h6 style={{ color: '#0d0d75' }}>
                                            {item.title.length <= 35 ? item.title : item.title.substring(0, 32) + '...'}
                                        </h6>
                                        <p style={{ color: 'green' }}>{item.authors}</p>
                                    </li>
                                ))
                            ) : (
                                <p></p>
                            )}
                        </ul>
                        <ul className="list-group list-group-flush">
                            {paperData != null && paperData.citelist.length > 0 ? (
                                paperData.citelist.map((item, index) => (
                                    <li key={index} className="list-group-item" style={{ cursor: 'pointer' }} onClick={() => updateInfo(paperData.citelist[index])}>
                                        <h6 style={{ color: '#0d0d75' }}>{item.title.length <= 35 ? item.title : item.title.substring(0, 32) + '...'}</h6>
                                        <p style={{ color: 'green' }}>{item.authors}</p>
                                    </li>
                                )))
                                : (
                                    <p></p>
                                )}


                        </ul>
                        <ul className="list-group list-group-flush">
                            {paperData != null && paperData.citelist.length == 0 && paperData.reflist.length==0 ? (
                                <p>No connected papers</p>
                                )
                                : (
                                    <p></p>
                                )}


                        </ul>
                    </div>



                    
                    
                </div>
                
    <div className="graphbox" style={{ flex: 3, position: 'relative' }}>
        {selectedOption === 'layer' && <Layercitaiongraph paperData={paperData} info={info} updateInfo={updateInfo} />}
        {selectedOption === 'year' && <Yearwise paperData={paperData} info={info} updateInfo={updateInfo} barchart1={barchart1}/>}
        {selectedOption === 'citationCount' && <Citationcount paperData={paperData} info={info} updateInfo={updateInfo} barchart2={barchart2}/>}
        {selectedOption === 'range' && <Range paperData={paperData} info={info} updateInfo={updateInfo} />}
        {selectedOption === 'trajectory' && <Trajectory paperData={paperData} info={info} updateInfo={updateInfo} />}
        {selectedOption === 'referencetree' && <Referencetree paperData={paperData} info={info} updateInfo={updateInfo} />}
        {selectedOption === 'citationtree' && <Citationtree paperData={paperData} info={info} updateInfo={updateInfo} />}
        {selectedOption === 'pagerank' && <Pagerank paperData={paperData} info={info} updateInfo={updateInfo} />}
        {selectedOption === 'similarity' && <Similarity paperData={paperData} info={info} updateInfo={updateInfo} />}
    </div>



                <div className="infobox" style={{ flex: 2, display: 'flex', flexDirection: 'column', margin: '1em', gap: '1em' }}>
                    <div>
                        {
                            info != null && (
                                <div style={{ width: '100%', marginTop: '1em' }}>
                                    <h5><strong>{info.title != null ? info.title : ' '}</strong></h5>
                                    <p>{info.comments != null ? info.comments : ' '}</p>
                                    <p><strong>Author:</strong>{info.authors != null ? info.authors : ' '}</p>
                                    <p><strong>Journal-ref:</strong>{info.journal != null ? info.journal : ' '}</p>
                                    <p><strong>Info:</strong>{info.body != null ? info.body : ' '}</p>
                                </div>
                            )
                        }
                    </div>


                </div>
            </div >
        </div>
            </div>
        )}
    </div>

    );
}
