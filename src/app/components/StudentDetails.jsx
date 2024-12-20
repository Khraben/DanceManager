import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaTimes,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaVenusMars,
  FaBirthdayCake,
  FaUsers,
  FaCalendarAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { fetchStudentDetails } from "../firebase/firebaseFirestoreService";
import Loading from "./Loading";

const StudentDetails = ({ isOpen, onClose, studentId }) => {
  const [student, setStudent] = useState(null);
  const [groupDetails, setGroupDetails] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchStudent = async () => {
        try {
          const { studentData, groupDetails } = await fetchStudentDetails(
            studentId
          );
          setStudent(studentData);
          setGroupDetails(groupDetails);
        } catch (error) {
          console.error("Error fetching student details: ", error);
        }
      };

      fetchStudent();
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  if (!student) {
    return <Loading />;
  }

  return (
    <Overlay>
      <ModalContainer>
        <ModalHeader>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <Title>INFORMACIÓN DE ALUMNO</Title>
          <Card>
            <FaUser />
            <DetailItem>
              <strong>Nombre:</strong> {student.name}
            </DetailItem>
          </Card>
          <Card>
            <FaPhone />
            <DetailItem>
              <strong>Celular:</strong> {student.phone}
            </DetailItem>
          </Card>
          <Card>
            <FaEnvelope />
            <DetailItem>
              <strong>Correo:</strong> {student.email}
            </DetailItem>
          </Card>
          <Card>
            <FaVenusMars />
            <DetailItem>
              <strong>Género:</strong> {student.gender}
            </DetailItem>
          </Card>
          <Card>
            <FaBirthdayCake />
            <DetailItem>
              <strong>Fecha de Cumpleaños:</strong> {student.birthday}
            </DetailItem>
          </Card>
          <Card>
            <FaExclamationTriangle />
            <DetailItem>
              <strong>Contacto de Emergencia:</strong>
              <div>{student.emergencyName}</div>
              <div>{student.emergencyPhone}</div>
            </DetailItem>
          </Card>
          <Card>
            <FaUsers />
            <DetailItem>
              <strong>Grupos:</strong>
            </DetailItem>
            <GroupList>
              {groupDetails.length === 0 ? (
                <li>INACTIVO</li>
              ) : (
                groupDetails.map((group, index) => (
                  <li
                    key={index}
                    style={{ fontWeight: group.isPrimary ? "bold" : "normal" }}
                  >
                    {group.name} ({group.level})
                  </li>
                ))
              )}
            </GroupList>
          </Card>
          <Card>
            <FaCalendarAlt />
            <DetailItem>
              <strong>Fecha de Pago:</strong> {student.paymentDate}
            </DetailItem>
          </Card>
        </ModalBody>
      </ModalContainer>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002;
`;

const ModalContainer = styled.div`
  margin-left: 80px;
  margin-right: 20px;
  background-color: #dddddd;
  padding: 20px;
  width: 600px;
  height: 730px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1003;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    width: 90%;
    padding: 15px;
    margin-left: 20px;
  }

  @media (max-width: 480px) {
    width: 95%;
    padding: 10px;
    margin-left: 45px;
    margin-right: 5px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: right;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333333;

  &:hover {
    color: #242424;
  }

  &:focus {
    outline: none;
  }
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  color: #333333;
  margin-bottom: 10px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const Card = styled.div`
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  svg {
    font-size: 24px;
    color: #333333;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;

    svg {
      font-size: 20px;
    }
  }
`;

const DetailItem = styled.p`
  margin: 0;
  font-size: 16px;
  color: #333;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const GroupList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;

  li {
    margin-bottom: 5px;
    font-size: 16px;
    color: #333;

    @media (max-width: 480px) {
      font-size: 14px;
    }
  }
`;

export default StudentDetails;
