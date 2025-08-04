import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config/config';

const Results = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [detailedScores, setDetailedScores] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Results - Current user:', user);
        
        // First check if the user is a candidate and has tests
        const statusRes = await axios.get(`${API_URL}/api/test/candidate-status`);
        console.log('Candidate status response:', statusRes.data);
        
        if (!statusRes.data.success || !statusRes.data.data.hasCandidate) {
          setError('Your account is not properly linked to a candidate profile. Please contact support.');
          setLoading(false);
          return;
        }
        
        if (statusRes.data.data.testCount === 0) {
          // No tests assigned yet
          setResults([]);
          setLoading(false);
          return;
        }
        
        // Fetch the detailed test assignments
        const candidateId = statusRes.data.data.candidateId;
        console.log('Results - Fetching test results for candidate_id:', candidateId);
        
        const res = await axios.get(`${API_URL}/api/test/test-assignments/candidate/${candidateId}`);
        if (res.data.success) {
          // Filter for completed tests only
          const completedTests = res.data.data.filter(test => test.completion_status === 'completed');
          setResults(completedTests);
        }
      } catch (error) {
        console.error('Failed to fetch test results:', error);
        setError('Failed to load your results. Please try again later.');
        toast.error('Failed to load your results. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getScoreColor = (score) => {
    if (!score && score !== 0) return '#666'; // N/A case
    if (score >= 80) return '#27ae60'; // Excellent
    if (score >= 70) return '#2ecc71'; // Good
    if (score >= 60) return '#f39c12'; // Satisfactory
    if (score >= 50) return '#e67e22'; // Needs Improvement
    return '#e74c3c'; // Poor
  };

  const fetchDetailedScores = async (assignmentId) => {
    setLoadingScores(true);
    try {
      const res = await axios.get(`${API_URL}/api/test/test-assignments/${assignmentId}/scores`);
      if (res.data.success) {
        setDetailedScores(res.data.data);
      } else {
        toast.error('Failed to load detailed scores');
      }
    } catch (error) {
      console.error('Error fetching detailed scores:', error);
      toast.error('Failed to load detailed scores');
    } finally {
      setLoadingScores(false);
    }
  };

  const handleViewDetails = (test) => {
    setSelectedTest(test);
    fetchDetailedScores(test.assignment_id);
  };

  const closeDetailedView = () => {
    setSelectedTest(null);
    setDetailedScores(null);
  };
  
  return (
    <MainLayout title="My Results">
      <div className="results-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            Loading your results...
          </div>
        ) : error ? (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '10px' }}>Error</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div>
            <div className="results-intro" style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Your Test Results</h2>
              <p style={{ color: '#666' }}>
                Here you can view the results of all your completed tests.
              </p>
            </div>
            
            {results.length === 0 ? (
              <div 
                style={{ 
                  backgroundColor: 'white',
                  padding: '30px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ marginBottom: '15px', color: '#3498db' }}>No Results Yet</h3>
                <p>You haven't completed any tests yet. Complete your assigned tests to see results here.</p>
              </div>
            ) : (
              <div 
                className="results-table-container"
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  overflow: 'auto'
                }}
              >
                <table 
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Test Name</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Completion Date</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Duration</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Score</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Feedback</th>
                      <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(result => {
                      // Calculate duration in minutes
                      let duration = 'N/A';
                      if (result.start_time && result.end_time) {
                        const startTime = new Date(result.start_time);
                        const endTime = new Date(result.end_time);
                        const durationMs = endTime - startTime;
                        const durationMins = Math.round(durationMs / (1000 * 60));
                        duration = `${durationMins} minutes`;
                      }
                      
                      return (
                        <tr key={result._id} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '15px' }}>{result.test?.test_name || 'Unnamed Test'}</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>{formatDate(result.end_time)}</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>{duration}</td>
                          <td style={{ 
                            padding: '15px', 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: getScoreColor(result.score)
                          }}>
                            {result.score !== undefined && result.score !== null ? `${result.score}%` : 'N/A'}
                          </td>
                          <td style={{ padding: '15px' }}>{result.feedback || 'No feedback provided'}</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleViewDetails(result)}
                              style={{
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                              onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                              onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Detailed Scores Modal */}
        {selectedTest && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '0'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>
                  Detailed Results: {selectedTest.test?.test_name || 'Test'}
                </h3>
                <button
                  onClick={closeDetailedView}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '20px' }}>
                {loadingScores ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    Loading detailed scores...
                  </div>
                ) : detailedScores ? (
                  <div>
                    {/* Overall Score */}
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Overall Score</h4>
                      <div style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: getScoreColor(detailedScores.total_score)
                      }}>
                        {detailedScores.total_score}%
                      </div>
                      <div style={{ color: '#666', marginTop: '5px' }}>
                        {detailedScores.total_questions} questions completed
                      </div>
                    </div>

                    {/* Domain Scores */}
                    {detailedScores.domain_scores && detailedScores.domain_scores.length > 0 && (
                      <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>Domain Scores</h4>
                        <div style={{ display: 'grid', gap: '15px' }}>
                          {detailedScores.domain_scores.map((domain, index) => (
                            <div key={index} style={{
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              padding: '15px',
                              backgroundColor: 'white'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                              }}>
                                <h5 style={{ margin: 0, color: '#2c3e50' }}>{domain.domain_name}</h5>
                                <span style={{
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  color: getScoreColor(domain.percentage)
                                }}>
                                  {domain.percentage}%
                                </span>
                              </div>
                              <div style={{
                                backgroundColor: '#ecf0f1',
                                height: '8px',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${domain.percentage}%`,
                                  height: '100%',
                                  backgroundColor: getScoreColor(domain.percentage),
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <div style={{ 
                                marginTop: '5px', 
                                fontSize: '14px', 
                                color: '#666' 
                              }}>
                                {domain.obtained_score} out of {domain.max_score} points
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subdomain Scores */}
                    {detailedScores.subdomain_scores && detailedScores.subdomain_scores.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>Subdomain Scores</h4>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {detailedScores.subdomain_scores.map((subdomain, index) => (
                            <div key={index} style={{
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              padding: '12px',
                              backgroundColor: '#fafafa'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                              }}>
                                <span style={{ fontWeight: '500', color: '#2c3e50' }}>
                                  {subdomain.subdomain_name}
                                </span>
                                <span style={{
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  color: getScoreColor(subdomain.percentage)
                                }}>
                                  {subdomain.percentage}%
                                </span>
                              </div>
                              <div style={{
                                backgroundColor: '#ecf0f1',
                                height: '6px',
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${subdomain.percentage}%`,
                                  height: '100%',
                                  backgroundColor: getScoreColor(subdomain.percentage),
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <div style={{ 
                                marginTop: '4px', 
                                fontSize: '12px', 
                                color: '#666' 
                              }}>
                                {subdomain.obtained_score} out of {subdomain.max_score} points
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Info */}
                    <div style={{
                      marginTop: '30px',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      <div><strong>Test Completed:</strong> {formatDate(detailedScores.end_time)}</div>
                      <div><strong>Test Started:</strong> {formatDate(detailedScores.start_time)}</div>
                      <div><strong>Status:</strong> {detailedScores.completion_status}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No detailed scores available for this test.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Results; 