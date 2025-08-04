import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MainLayout from '../layouts/MainLayout';

import { API_URL } from '../config/config';

const JobSlotForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    slot_name: '',
    job_id: 0,
    cat_id: 0,
    slot_description: '',
    slot_status: 1,
    created_at: new Date().toISOString()
  });
  
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchJobSlot = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const res = await axios.get(`${API_URL}/api/job-slots/${id}`);
          if (res.data.success) {
            const jobSlot = res.data.data;
            
            // Ensure we have numeric IDs
            if (typeof jobSlot.job_id === 'object' && jobSlot.job_id !== null) {
              jobSlot.job_id = jobSlot.job_id.job_id || 0;
            }
            
            if (typeof jobSlot.cat_id === 'object' && jobSlot.cat_id !== null) {
              jobSlot.cat_id = jobSlot.cat_id.cat_id || 0;
            }
            
            setFormData(jobSlot);
          }
        } catch (error) {
          console.error('Failed to fetch job slot:', error);
          toast.error('Failed to load job slot data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    // Fetch data
    fetchJobs();
    fetchCategories();
    fetchJobSlot();
  }, [id, isEditMode]);
  
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs`);
      if (res.data.success) {
        setJobs(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs.');
    }
  };
  
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/test/categories`);
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories.');
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle numeric values
    if (name === 'job_id' || name === 'cat_id' || name === 'slot_status') {
      const numValue = value === '' ? 0 : Number(value);
      
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
      
      return;
    }
    
    // Handle all other inputs
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let response;
      
      if (isEditMode) {
        // Update existing job slot
        response = await axios.put(`${API_URL}/api/job-slots/${id}`, formData);
      } else {
        // Create new job slot
        response = await axios.post(`${API_URL}/api/job-slots`, formData);
      }
      
      if (response.data.success) {
        toast.success(isEditMode ? 'Job slot updated successfully!' : 'Job slot created successfully!');
        
        // Redirect back to job slots list or the associated job's slots list
        if (formData.job_id) {
          navigate(`/jobs/${formData.job_id}/slots`);
        } else {
          navigate('/job-slots');
        }
      } else {
        toast.error(response.data.message || 'Failed to save job slot.');
      }
    } catch (error) {
      console.error('Error saving job slot:', error);
      toast.error(error.response?.data?.message || 'An error occurred while saving the job slot.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>{isEditMode ? 'Edit Job Slot' : 'Create New Job Slot'}</h1>
          <Link 
            to="/job-slots"
            style={{
              padding: '8px 16px',
              backgroundColor: '#f1f1f1',
              color: '#333',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Back to Job Slots List
          </Link>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading job slot data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div 
              className="form-section"
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '25px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                marginBottom: '30px'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Job Slot Details</h3>
              <div 
                className="form-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px'
                }}
              >
                <div className="form-group">
                  <label 
                    htmlFor="slot_name"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    Slot Name*
                  </label>
                  <input
                    type="text"
                    id="slot_name"
                    name="slot_name"
                    placeholder="Enter slot name"
                    value={formData.slot_name}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label 
                    htmlFor="job_id"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    Job*
                  </label>
                  <select
                    id="job_id"
                    name="job_id"
                    value={formData.job_id || ''}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="">Select Job</option>
                    {jobs.map(job => (
                      <option key={job._id} value={job.job_id}>
                        {job.job_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label 
                    htmlFor="cat_id"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    Category
                  </label>
                  <select
                    id="cat_id"
                    name="cat_id"
                    value={formData.cat_id || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category.cat_id}>
                        {category.cat_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label 
                    htmlFor="slot_status"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    Status*
                  </label>
                  <select
                    id="slot_status"
                    name="slot_status"
                    value={formData.slot_status}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                    <option value={2}>Filled</option>
                  </select>
                </div>
              </div>
              
              <div 
                style={{
                  marginTop: '20px'
                }}
              >
                <div className="form-group">
                  <label 
                    htmlFor="slot_description"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    Slot Description
                  </label>
                  <textarea
                    id="slot_description"
                    name="slot_description"
                    placeholder="Enter slot description"
                    value={formData.slot_description}
                    onChange={handleChange}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      resize: 'vertical'
                    }}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div 
              className="form-actions"
              style={{
                marginTop: '30px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <Link 
                to={formData.job_id ? `/jobs/${formData.job_id}/slots` : "/job-slots"}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                Cancel
              </Link>
              <button 
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Saving...' : (isEditMode ? 'Update Job Slot' : 'Create Job Slot')}
              </button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
};

export default JobSlotForm; 