"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaSearch,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import GroupModal from "../components/GroupModal";
import GroupDetails from "../components/GroupDetails";
import Loading from "../components/Loading";
import ConfirmationModal from "../components/ConfirmationModal";
import ReassignStudentsModal from "../components/ReassignStudentsModal";
import {
  fetchGroups,
  deleteGroup,
  fetchStudentGroupsByGroupId,
  fetchInstructorByEmail,
} from "../firebase/firebaseFirestoreService";
import { useAuth } from "../context/AuthContext";

export default function GroupList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const { isInstructorUser, user } = useAuth();

  useEffect(() => {
    fetchGroupsData();
  }, []);

  const fetchGroupsData = async () => {
    setLoading(true);
    try {
      const groupsData = await fetchGroups();
      if (!isInstructorUser) {
        setGroups(groupsData);
      } else {
        const instructor = await fetchInstructorByEmail(user.email);
        const filteredGroups = isInstructorUser
          ? groupsData.filter((group) => group.instructor === instructor.name)
          : groupsData;
        setGroups(filteredGroups);
      }
    } catch (error) {
      console.error("Error fetching groups: ", error);
    }
    setLoading(false);
  };

  const handleOpenModal = (groupId = null) => {
    setEditingGroupId(groupId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    fetchGroupsData();
  };

  const handleViewGroupDetails = (groupId) => {
    setSelectedGroupId(groupId);
  };

  const handleCloseGroupDetails = () => {
    setSelectedGroupId(null);
  };

  const handleOpenReassignModal = async (group) => {
    setLoading(true);
    try {
      const students = await fetchStudentGroupsByGroupId(group.id);
      if (students.length === 0) {
        setGroupToDelete(group);
        setIsConfirmationModalOpen(true);
      } else {
        setGroupToDelete(group);
        setIsReassignModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching students: ", error);
    }
    setLoading(false);
  };

  const handleCloseReassignModal = () => {
    setIsReassignModalOpen(false);
    setGroupToDelete(null);
    fetchGroupsData();
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setGroupToDelete(null);
  };

  const handleConfirmDeleteGroup = async () => {
    if (groupToDelete) {
      await deleteGroup(groupToDelete.id);
      fetchGroupsData();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <Wrapper>
      <Title>Lista de Grupos</Title>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Filtrar por nombre del grupo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <ClearButton onClick={handleClearSearch}>
            <FaTimes />
          </ClearButton>
        )}
        <SearchIcon />
      </SearchContainer>
      <TableContainer>
        {filteredGroups.length === 0 ? (
          <NoDataMessage>No hay grupos registrados en el sistema</NoDataMessage>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Instructor</th>
                <th>Nivel</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group, index) => (
                <tr key={index}>
                  <td>{group.name}</td>
                  <td>{group.instructor}</td>
                  <td>{group.level}</td>
                  <td>
                    {!isInstructorUser && (
                      <IconContainer>
                        <InfoIcon
                          onClick={() => handleViewGroupDetails(group.id)}
                        />
                        <EditIcon onClick={() => handleOpenModal(group.id)} />
                        <DeleteIcon
                          onClick={() => handleOpenReassignModal(group)}
                        />
                      </IconContainer>
                    )}

                    {isInstructorUser && (
                      <IconContainer>
                        <InfoIcon
                          onClick={() => handleViewGroupDetails(group.id)}
                        />
                      </IconContainer>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableContainer>
      {!isInstructorUser && (
        <AddButton onClick={() => handleOpenModal()}>Agregar Grupo</AddButton>
      )}
      <GroupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        groupId={editingGroupId}
      />
      <GroupDetails
        isOpen={!!selectedGroupId}
        onClose={handleCloseGroupDetails}
        groupId={selectedGroupId}
      />
      <ReassignStudentsModal
        isOpen={isReassignModalOpen}
        onClose={handleCloseReassignModal}
        groupId={groupToDelete?.id}
      />
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={handleConfirmDeleteGroup}
        message={`¿Estás seguro que deseas eliminar el grupo "${groupToDelete?.name}"?`}
      />
    </Wrapper>
  );
}

const NoDataMessage = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  margin-top: 20px;
`;

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 480px) {
    padding: 10px;
    margin-left: 50px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  color: #333333;
  margin-bottom: 20px;
  text-transform: uppercase;
  font-weight: 700;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const AddButton = styled.button`
  padding: 10px 20px;
  margin-top: 20px;
  font-size: 14px;
  font-weight: bold;
  color: #dddddd;
  background-color: #333333;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #242424;
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 12px;
    margin-left: -80px;
  }
`;

const TableContainer = styled.div`
  width: 100%;
  padding: 0 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 500px;
  background-color: rgba(221, 221, 221, 1);

  @media (max-width: 480px) {
    padding: 0 10px;
  }
`;

const Table = styled.table`
  width: 100%;
  max-width: 1200px;
  border-collapse: collapse;
  background-color: transparent;
  border-radius: 8px;

  thead {
    position: sticky;
    top: 0;
    background-color: #333333;
    color: #dddddd;
    z-index: 1;
  }

  th,
  td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    text-transform: uppercase;
    font-size: 14px;
    letter-spacing: 0.1em;
  }

  td {
    font-size: 14px;
    font-weight: bold;
    color: #333;
  }

  tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 768px) {
    th,
    td {
      font-size: 12px;
      padding: 12px 15px;
    }
  }

  @media (max-width: 480px) {
    th,
    td {
      font-size: 10px;
      padding: 10px 12px;
    }
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
  margin-bottom: 20px;
  position: relative;

  @media (max-width: 480px) {
    padding: 0 10px;
  }
`;

const SearchInput = styled.input`
  width: 95%;
  padding: 10px 15px;
  font-size: 14px;
  border: 2px solid #333333;
  border-radius: 5px;
  outline: none;
  background-color: transparent;

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 12px;
  }
`;

const SearchIcon = styled(FaSearch)`
  margin-left: -35px;
  color: #333333;
  font-size: 18px;
  cursor: pointer;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;

  @media (max-width: 480px) {
    justify-content: space-between;
  }
`;

const InfoIcon = styled(FaInfoCircle)`
  color: #333333;
  cursor: pointer;
  font-size: 20px;

  &:hover {
    color: #242424;
  }

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const EditIcon = styled(FaEdit)`
  color: #333333;
  cursor: pointer;
  font-size: 20px;
  margin-right: 10px;
  margin-left: 10px;

  &:hover {
    color: #242424;
  }

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const DeleteIcon = styled(FaTrash)`
  color: #333333;
  cursor: pointer;
  font-size: 18px;

  &:hover {
    color: #ff0000;
  }

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 50px;
  top: 10px;
  background: none;
  border: none;
  color: #333333;
  font-size: 18px;
  cursor: pointer;
  z-index: 1001;

  @media (max-width: 480px) {
    right: 45px;
    font-size: 16px;
  }
`;
