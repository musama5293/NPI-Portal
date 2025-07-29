import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Box, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Chip,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Add as AddIcon
} from '@mui/icons-material';
import MainLayout from '../layouts/MainLayout';
import { getBoards, deleteBoard } from '../utils/api';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';

const BoardList = () => {
  const theme = useTheme();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const response = await getBoards();
      if (response.data.success) {
        setBoards(response.data.data || []);
      } else {
        setError('Failed to load evaluation boards');
      }
    } catch (err) {
      console.error('Error loading boards:', err);
      setError('Failed to load evaluation boards. Please try again.');
      toast.error('Failed to load evaluation boards');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (board) => {
    setBoardToDelete(board);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBoardToDelete(null);
  };

  const confirmDelete = async () => {
    if (!boardToDelete) return;
    
    try {
      await deleteBoard(boardToDelete._id);
      toast.success('Board deleted successfully');
      loadBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Failed to delete board');
    } finally {
      closeDeleteDialog();
    }
  };

  const renderBoardStatus = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Active" color="success" size="small" variant="outlined" />;
      case 'completed':
        return <Chip label="Completed" color="primary" size="small" variant="outlined" />;
      case 'scheduled':
        return <Chip label="Scheduled" color="warning" size="small" variant="outlined" />;
      default:
        return <Chip label="Draft" color="default" size="small" variant="outlined" />;
    }
  };

  const handleViewCandidates = (board) => {
    navigate(`/boards/${board._id}/candidates`);
  };

  const handleCreateBoard = () => {
    navigate('/boards/create');
  };

  const handleEditBoard = (board) => {
    navigate(`/boards/edit/${board._id}`);
  };

  // Define columns for the DataTable
  const columns = [
    { 
      id: 'board_id', 
      label: 'Board ID', 
      accessor: row => row._id?.substring(0, 8) + '...',
    },
    { 
      id: 'board_name', 
      label: 'Board Name', 
      accessor: 'board_name'
    },
    { 
      id: 'board_date', 
      label: 'Date', 
      accessor: row => new Date(row.board_date).toLocaleDateString()
    },
    { 
      id: 'candidate_count', 
      label: 'Candidates', 
      accessor: row => row.candidate_count || 0,
      render: (value, row) => (
                        <Chip 
          label={value} 
          color={value ? "primary" : "default"}
                          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleViewCandidates(row);
          }}
                          sx={{ cursor: 'pointer' }}
                        />
      )
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: 'status',
      render: (value) => renderBoardStatus(value)
    }
  ];

  // Define actions for the DataTable
  const actions = [
    {
      name: 'Manage Candidates',
      icon: <GroupIcon fontSize="small" />,
      tooltip: 'Manage Candidates',
      color: 'primary',
      onClick: handleViewCandidates
    },
    {
      name: 'Edit',
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit Board',
      color: 'info',
      onClick: handleEditBoard
    },
    {
      name: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete Board',
      color: 'error',
      onClick: openDeleteDialog
    }
  ];

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredBoards = boards.filter(board => 
    board.board_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <Box sx={{ p: 2 }}>
        <PageHeader
          title="Evaluation Boards"
          subtitle="Create and manage evaluation boards for candidates"
          breadcrumbs={[
            { label: 'Administration' },
            { label: 'Evaluation Boards' }
          ]}
          actionLabel="Create Board"
          actionIcon={<AddIcon />}
          onActionClick={handleCreateBoard}
        />
        
        <DataTable
          columns={columns}
          data={filteredBoards}
          isLoading={loading}
          title="Evaluation Boards"
          actions={actions}
          onRowClick={handleViewCandidates}
          searchPlaceholder="Search boards..."
          emptyMessage="No evaluation boards found. Create a new board to get started."
          onSearch={handleSearch}
          initialSearchTerm={searchTerm}
          getRowId={(row) => row._id}
          containerProps={{ elevation: 2 }}
          error={error}
          onRetry={loadBoards}
        />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the board "{boardToDelete?.board_name}"?
            This will also remove all candidate assignments to this board.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      </Box>
    </MainLayout>
  );
};

export default BoardList; 