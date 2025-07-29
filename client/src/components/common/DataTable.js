import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

/**
 * A reusable data table component with search, pagination, and action handling
 */
const DataTable = ({
  columns,
  data,
  isLoading = false,
  title,
  actions = [],
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Search...',
  initialSearchTerm = '',
  pagination = true,
  rowsPerPageOptions = [10, 25, 50, 100],
  defaultRowsPerPage = 10,
  sortable = true,
  defaultSortColumn = null,
  defaultSortDirection = 'asc',
  emptyMessage = 'No data available',
  containerProps = {},
  tableProps = {},
  onSearch,
  onSort,
  onChangePage,
  onChangeRowsPerPage,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAllRows,
  getRowId = (row) => row.id || row._id,
  getRowKey = (row, index) => getRowId(row) || index,
  renderExpandedRow,
  ...rest
}) => {
  const theme = useTheme();
  
  // Local state for client-side operations
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filteredData, setFilteredData] = useState(data);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortColumn, setSortColumn] = useState(defaultSortColumn);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuRow, setActionMenuRow] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Update filtered data when data changes or search term changes
  useEffect(() => {
    if (onSearch) {
      // If external search handler is provided, use the data as is
      setFilteredData(data);
    } else if (searchTerm.trim() === '') {
      // If search term is empty, show all data
      setFilteredData(data);
    } else {
      // Otherwise, filter data client-side
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const filtered = data.filter(row => {
        return columns.some(column => {
          const value = column.accessor ? 
            (typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]) 
            : '';
          return value && String(value).toLowerCase().includes(lowercasedSearchTerm);
        });
      });
      setFilteredData(filtered);
    }
    
    // Reset to first page when data or search changes
    setPage(0);
  }, [data, searchTerm, columns, onSearch]);

  // Client-side sorting
  const handleSort = (columnId) => {
    if (!sortable) return;
    
    const isAsc = sortColumn === columnId && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    
    if (onSort) {
      // If external sort handler is provided, use it
      onSort(columnId, newDirection);
    } else {
      // Otherwise, sort data client-side
      const sorted = [...filteredData].sort((a, b) => {
        const column = columns.find(col => col.id === columnId);
        if (!column) return 0;
        
        const valueA = column.accessor ? 
          (typeof column.accessor === 'function' ? column.accessor(a) : a[column.accessor]) 
          : '';
        const valueB = column.accessor ? 
          (typeof column.accessor === 'function' ? column.accessor(b) : b[column.accessor]) 
          : '';
          
        if (valueA === valueB) return 0;
        
        // Handle different data types
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return isAsc ? valueA - valueB : valueB - valueA;
        }
        
        // Default string comparison
        return isAsc 
          ? String(valueA).localeCompare(String(valueB))
          : String(valueB).localeCompare(String(valueA));
      });
      
      setFilteredData(sorted);
    }
    
    setSortColumn(columnId);
    setSortDirection(newDirection);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    if (onChangePage) {
      onChangePage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    if (onChangeRowsPerPage) {
      onChangeRowsPerPage(newRowsPerPage);
    }
  };

  // Handle row click
  const handleRowClick = (event, row) => {
    if (onRowClick) {
      onRowClick(row);
    }
    
    if (renderExpandedRow) {
      const rowId = getRowId(row);
      setExpandedRow(expandedRow === rowId ? null : rowId);
    }
  };

  // Handle action menu
  const handleActionMenuOpen = (event, row) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setActionMenuRow(row);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionMenuRow(null);
  };

  const handleActionClick = (action) => {
    if (action.onClick && actionMenuRow) {
      action.onClick(actionMenuRow);
    }
    handleActionMenuClose();
  };

  // Calculate pagination
  const paginatedData = pagination 
    ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filteredData;

  return (
    <Paper 
      elevation={1}
      sx={{ 
        width: '100%', 
        overflow: 'hidden',
        borderRadius: 2,
        ...containerProps.sx
      }}
      {...containerProps}
      {...rest}
    >
      {/* Header with title and search */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        {title && (
          <Typography variant="h6" component="h2" fontWeight={600}>
            {title}
          </Typography>
        )}
        
        {searchable && (
          <TextField
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ maxWidth: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>
      
      {/* Table */}
      <TableContainer sx={{ maxHeight: tableProps.maxHeight }}>
        <Table stickyHeader size="medium" {...tableProps}>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ 
                    minWidth: column.minWidth,
                    width: column.width,
                    maxWidth: column.maxWidth,
                    ...column.headerStyle
                  }}
                  sortDirection={sortable && sortColumn === column.id ? sortDirection : false}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={sortColumn === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              
              {actions.length > 0 && (
                <TableCell align="right" sx={{ width: 100 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const rowId = getRowId(row);
                const isRowExpanded = expandedRow === rowId;
                
                return (
                  <React.Fragment key={getRowKey(row, index)}>
                    <TableRow
                      hover
                      onClick={(e) => handleRowClick(e, row)}
                      sx={{ 
                        cursor: onRowClick || renderExpandedRow ? 'pointer' : 'default',
                        '&:last-child td, &:last-child th': { border: 0 },
                        ...(isRowExpanded && { 
                          backgroundColor: `${theme.palette.primary.main}08`
                        })
                      }}
                    >
                      {columns.map(column => {
                        const value = column.accessor ? 
                          (typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]) 
                          : '';
                          
                        return (
                          <TableCell 
                            key={column.id} 
                            align={column.align || 'left'}
                            sx={column.cellStyle}
                          >
                            {column.render ? column.render(value, row) : value}
                          </TableCell>
                        );
                      })}
                      
                      {actions.length > 0 && (
                        <TableCell align="right">
                          {actions.length === 1 ? (
                            <Tooltip title={actions[0].tooltip || actions[0].name}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actions[0].onClick(row);
                                }}
                                color={actions[0].color || 'default'}
                                disabled={actions[0].disabled && actions[0].disabled(row)}
                              >
                                {actions[0].icon}
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Actions">
                              <IconButton
                                size="small"
                                onClick={(e) => handleActionMenuOpen(e, row)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    
                    {isRowExpanded && renderExpandedRow && (
                      <TableRow>
                        <TableCell 
                          colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                          sx={{ 
                            py: 0,
                            backgroundColor: `${theme.palette.primary.main}05`
                          }}
                        >
                          {renderExpandedRow(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
      
      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        {actions.map((action, index) => {
          // Get the appropriate display text - use label function if available
          const displayText = actionMenuRow && action.label && typeof action.label === 'function' 
            ? action.label(actionMenuRow) 
            : action.label || action.name || '';
            
          // Get the icon element
          const iconElement = typeof action.icon === 'function' && actionMenuRow 
            ? action.icon(actionMenuRow) 
            : action.icon;
            
          // Determine color
          const colorValue = action.color && action.color instanceof Function && actionMenuRow
            ? action.color(actionMenuRow)
            : action.color;
            
          const colorStyle = colorValue ? {
            color: `${colorValue}.main`
          } : {};
            
          return (
          <MenuItem
            key={index}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled && actionMenuRow && action.disabled(actionMenuRow)}
              sx={{ 
                ...colorStyle
              }}
          >
              {iconElement && (
                <ListItemIcon sx={{...colorStyle}}>
                  {iconElement}
              </ListItemIcon>
            )}
              {displayText || 'Action'}
          </MenuItem>
          );
        })}
      </Menu>
    </Paper>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      align: PropTypes.oneOf(['left', 'right', 'center']),
      minWidth: PropTypes.number,
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      maxWidth: PropTypes.number,
      sortable: PropTypes.bool,
      render: PropTypes.func,
      headerStyle: PropTypes.object,
      cellStyle: PropTypes.object
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  title: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      icon: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      onClick: PropTypes.func.isRequired,
      color: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      disabled: PropTypes.func,
      hide: PropTypes.func
    })
  ),
  onRowClick: PropTypes.func,
  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  initialSearchTerm: PropTypes.string,
  pagination: PropTypes.bool,
  rowsPerPageOptions: PropTypes.array,
  defaultRowsPerPage: PropTypes.number,
  sortable: PropTypes.bool,
  defaultSortColumn: PropTypes.string,
  defaultSortDirection: PropTypes.oneOf(['asc', 'desc']),
  emptyMessage: PropTypes.string,
  containerProps: PropTypes.object,
  tableProps: PropTypes.object,
  onSearch: PropTypes.func,
  onSort: PropTypes.func,
  onChangePage: PropTypes.func,
  onChangeRowsPerPage: PropTypes.func,
  selectable: PropTypes.bool,
  selectedRows: PropTypes.array,
  onSelectRow: PropTypes.func,
  onSelectAllRows: PropTypes.func,
  getRowId: PropTypes.func,
  getRowKey: PropTypes.func,
  renderExpandedRow: PropTypes.func
};

export default DataTable; 