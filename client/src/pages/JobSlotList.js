import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';

const API_URL = 'http://localhost:5000';

const JobSlotList = () => {
  const { id: jobId } = useParams(); // If this component is accessed via /jobs/:id/slots
  const navigate = useNavigate();
  
  const [jobSlots, setJobSlots] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  
  const isJobSpecific = Boolean(jobId);
  
  useEffect(() => {
    fetchData();
  }, [jobId]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories first for reference data
      const categoriesRes = await axios.get(`${API_URL}/api/test/categories`);
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data);
      }
      
      if (isJobSpecific) {
        // If viewing slots for a specific job
        const [jobSlotsRes, jobRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/${jobId}/slots`),
          axios.get(`${API_URL}/api/jobs/${jobId}`)
        ]);
        
        if (jobSlotsRes.data.success) {
          setJobSlots(jobSlotsRes.data.data);
        }
        
        if (jobRes.data.success) {
          setJob(jobRes.data.data);
        }
      } else {
        // If viewing all job slots
        const [jobSlotsRes, jobsRes] = await Promise.all([
          axios.get(`${API_URL}/api/job-slots`),
          axios.get(`${API_URL}/api/jobs`)
        ]);
        
        if (jobSlotsRes.data.success) {
          setJobSlots(jobSlotsRes.data.data);
        }
        
        if (jobsRes.data.success) {
          setJobs(jobsRes.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this job slot?')) {
      try {
        const response = await axios.delete(`${API_URL}/api/job-slots/${slotId}`);
        
        if (response.data.success) {
          toast.success('Job slot deleted successfully!');
          // Refresh the list
          fetchData();
        } else {
          toast.error(response.data.message || 'Failed to delete job slot.');
        }
      } catch (error) {
        console.error('Error deleting job slot:', error);
        toast.error(error.response?.data?.message || 'An error occurred while deleting the job slot.');
      }
    }
  };
  
  const getJobName = (jobId) => {
    const foundJob = jobs.find(j => j.job_id === jobId);
    return foundJob ? foundJob.job_name : 'Unknown Job';
  };
  
  const getCategoryName = (catId) => {
    const foundCategory = categories.find(c => c.cat_id === catId);
    return foundCategory ? foundCategory.cat_name : '';
  };
  
  const getStatusBadge = (status) => {
    let bgColor, textColor, text;
    
    switch (status) {
      case 1:
        bgColor = '#dcfce7';
        textColor = '#166534';
        text = 'Active';
        break;
      case 2:
        bgColor = '#fef9c3';
        textColor = '#854d0e';
        text = 'Filled';
        break;
      case 0:
      default:
        bgColor = '#f1f5f9';
        textColor = '#475569';
        text = 'Inactive';
    }
    
    return (
      <span style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.85rem',
        fontWeight: 'bold'
      }}>
        {text}
      </span>
    );
  };
  
  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>
            {isJobSpecific ? `Job Slots for "${job?.job_name || 'Loading...'}"` : 'All Job Slots'}
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isJobSpecific && (
              <Link 
                to="/jobs"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f1f1',
                  color: '#333',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Back to Jobs
              </Link>
            )}
            <Link 
              to={isJobSpecific ? `/job-slots/create?job_id=${jobId}` : "/job-slots/create"}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Add New Slot
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading job slots...</p>
          </div>
        ) : jobSlots.length === 0 ? (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
              No job slots found.
            </p>
            <Link 
              to={isJobSpecific ? `/job-slots/create?job_id=${jobId}` : "/job-slots/create"}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Create Your First Job Slot
            </Link>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Slot Name</th>
                  {!isJobSpecific && (
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Job</th>
                  )}
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Category</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Created</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobSlots.map(slot => (
                  <tr key={slot._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 15px' }}>{slot.slot_name}</td>
                    {!isJobSpecific && (
                      <td style={{ padding: '12px 15px' }}>
                        {typeof slot.job_id === 'object' && slot.job_id !== null
                          ? slot.job_id.job_name
                          : getJobName(slot.job_id)}
                      </td>
                    )}
                    <td style={{ padding: '12px 15px' }}>
                      {typeof slot.cat_id === 'object' && slot.cat_id !== null
                        ? slot.cat_id.cat_name
                        : getCategoryName(slot.cat_id)}
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      {getStatusBadge(slot.slot_status)}
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      {new Date(slot.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Link 
                          to={`/job-slots/edit/${slot._id}`}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f8f9fa',
                            color: '#333',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontSize: '0.85rem'
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(slot._id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default JobSlotList; 