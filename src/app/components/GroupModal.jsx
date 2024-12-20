import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  fetchInstructors,
  fetchExistingGroups,
  addGroup,
  fetchGroupById,
  updateGroup,
} from "../firebase/firebaseFirestoreService";
import { TextInput, Select } from "./Input";
import Loading from "./Loading";

const GroupModal = ({ isOpen, onClose, onGroupAdded, groupId }) => {
  const [instructor, setInstructor] = useState("");
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [level, setLevel] = useState("Nivel I");
  const [instructors, setInstructors] = useState([]);
  const [existingGroups, setExistingGroups] = useState([]);
  const [error, setError] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isStartDateDisabled, setIsStartDateDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
      fetchInstructorsData();
      fetchExistingGroupsData();
      if (groupId) {
        fetchGroupData(groupId);
      }
    } else {
      document.body.classList.remove("no-scroll");
      resetFields();
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isOpen, groupId]);

  const fetchInstructorsData = async () => {
    const instructorsData = await fetchInstructors();
    setInstructors(instructorsData);
  };

  const fetchExistingGroupsData = async () => {
    const groupsData = await fetchExistingGroups();
    setExistingGroups(groupsData);
  };

  const fetchGroupData = async (id) => {
    try {
      const groupData = await fetchGroupById(id);
      setInstructor(groupData.instructor);
      setDay(groupData.day);
      setStartTime(groupData.startTime);
      setEndTime(groupData.endTime);
      setLevel(groupData.level);
      setStartDate(groupData.startDate);
      if (groupData.level === "Taller") {
        setWorkshopName(groupData.name);
      }
      if (isPastDate(groupData.startDate)) {
        setIsStartDateDisabled(true);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
  };

  const isPastDate = (date) => {
    const [day, month, year] = date.split("/").map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    return selectedDate < today;
  };

  const handleStartTimeChange = (e) => {
    const selectedTime = e.target.value;
    setStartTime(selectedTime);
    const [hours, minutes, period] = selectedTime
      .match(/(\d+):(\d+)(\w+)/)
      .slice(1);
    let endHours =
      parseInt(hours) + (period === "pm" && hours !== "12" ? 12 : 0);
    endHours += 1;
    let endMinutes = parseInt(minutes) + 30;
    if (endMinutes >= 60) {
      endMinutes -= 60;
      endHours += 1;
    }
    const endPeriod = endHours >= 12 ? "pm" : "am";
    endHours = endHours > 12 ? endHours - 12 : endHours;
    setEndTime(
      `${endHours}:${endMinutes < 10 ? "0" : ""}${endMinutes}${endPeriod}`
    );
  };

  const handleDayChange = (e) => {
    setDay(e.target.value);
    setStartTime("");
    setEndTime("");
    setStartDate("");
  };

  const handleSave = async () => {
    if (
      !instructor ||
      !day ||
      !startTime ||
      !startDate ||
      (level === "Taller" && !workshopName)
    ) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setError("");
    setLoading(true);

    const name = level === "Taller" ? `${workshopName}` : `${day} ${startTime}`;

    const newGroup = {
      instructor,
      day,
      startTime,
      endTime,
      level,
      name,
      startDate,
    };

    try {
      if (groupId) {
        await updateGroup(groupId, newGroup);
      } else {
        await addGroup(newGroup);
      }
      resetFields();
      onClose();
      if (onGroupAdded) {
        onGroupAdded(newGroup);
      }
    } catch (error) {
      setError("Error al agregar el grupo");
    } finally {
      setLoading(false);
    }
  };

  const resetFields = () => {
    setInstructor("");
    setDay("");
    setStartTime("");
    setEndTime("");
    setLevel("Nivel I");
    setWorkshopName("");
    setError("");
    setStartDate("");
    setIsStartDateDisabled(false);
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setError("");
  };

  const generateTimeOptions = () => {
    const times = [];
    const startHour = 9;
    const endHour = 19;
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const period = hour < 12 ? "am" : "pm";
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const time = `${displayHour}:${minute === 0 ? "00" : minute}${period}`;
        times.push(time);
      }
    }
    return times;
  };

  const convertTo24HourFormat = (time) => {
    const [hours, minutes, period] = time.match(/(\d+):(\d+)(\w+)/).slice(1);
    let hours24 = parseInt(hours);
    if (period === "pm" && hours !== "12") {
      hours24 += 12;
    }
    if (period === "am" && hours === "12") {
      hours24 = 0;
    }
    return `${hours24}:${minutes}`;
  };

  const isTimeDisabled = (time) => {
    const selectedTime24 = convertTo24HourFormat(time);
    const [selectedHours, selectedMinutes] = selectedTime24
      .split(":")
      .map(Number);
    const selectedTimeInMinutes = selectedHours * 60 + selectedMinutes;

    return existingGroups.some((group) => {
      if (group.day !== day) return false;

      const groupStart24 = convertTo24HourFormat(group.startTime);
      const groupEnd24 = convertTo24HourFormat(group.endTime);
      const [groupStartHours, groupStartMinutes] = groupStart24
        .split(":")
        .map(Number);
      const [groupEndHours, groupEndMinutes] = groupEnd24
        .split(":")
        .map(Number);
      const groupStartTimeInMinutes = groupStartHours * 60 + groupStartMinutes;
      const groupEndTimeInMinutes = groupEndHours * 60 + groupEndMinutes;

      return (
        selectedTimeInMinutes >= groupStartTimeInMinutes - 60 &&
        selectedTimeInMinutes < groupEndTimeInMinutes
      );
    });
  };

  const generateDateOptions = () => {
    if (!day) return [];
    const daysOfWeek = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const dayIndex = daysOfWeek.indexOf(day);
    if (dayIndex === -1) return [];

    const dates = [];
    const today = new Date();
    let currentDate = new Date(
      today.setDate(today.getDate() + ((dayIndex - today.getDay() + 7) % 7))
    );

    for (let i = 0; i < 8; i++) {
      const day = String(currentDate.getDate()).padStart(2, "0");
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const year = currentDate.getFullYear();
      dates.push(`${day}/${month}/${year}`);
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return dates;
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer>
        {loading ? (
          <Loading />
        ) : (
          <>
            <ModalHeader>
              <h2>{groupId ? "Editar Grupo" : "Agregar Nuevo Grupo"}</h2>
            </ModalHeader>
            <ModalBody>
              <Form>
                <Select
                  value={instructor}
                  onChange={handleInputChange(setInstructor)}
                  placeholder="Seleccione un instructor"
                >
                  {instructors.map((inst, index) => (
                    <option key={index} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={day}
                  onChange={handleDayChange}
                  placeholder="Seleccione un día"
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                </Select>
                <Select
                  value={startDate}
                  onChange={handleInputChange(setStartDate)}
                  disabled={!day || isStartDateDisabled}
                  placeholder="Fecha de inicio"
                >
                  {generateDateOptions().map((date, index) => (
                    <option key={index} value={date}>
                      {date}
                    </option>
                  ))}
                </Select>
                <Select
                  value={startTime}
                  onChange={handleStartTimeChange}
                  disabled={!day}
                  placeholder="Hora de inicio"
                >
                  {generateTimeOptions().map((time, index) => (
                    <option
                      key={index}
                      value={time}
                      disabled={isTimeDisabled(time)}
                    >
                      {time}
                    </option>
                  ))}
                </Select>
                <TextInput
                  type="text"
                  value={endTime || " "}
                  placeholder="Hora de finalización"
                  readOnly
                />
                <Select
                  value={level}
                  onChange={handleInputChange(setLevel)}
                  placeholder="Seleccione un nivel"
                >
                  <option value="Nivel I">Nivel I</option>
                  <option value="Nivel II-A">Nivel II-A</option>
                  <option value="Nivel II-B">Nivel II-B</option>
                  <option value="Nivel III-1">Nivel III-1</option>
                  <option value="Nivel III-2">Nivel III-2</option>
                  <option value="Nivel III-3">Nivel III-3</option>
                  <option value="Nivel IV">Nivel IV</option>
                  <option value="Taller">Taller</option>
                </Select>
                {level === "Taller" && (
                  <TextInput
                    type="text"
                    placeholder="Nombre del Taller"
                    value={workshopName}
                    onChange={handleInputChange(setWorkshopName)}
                  />
                )}
              </Form>
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </ModalBody>
            <ModalFooter>
              <CancelButton
                onClick={() => {
                  resetFields();
                  onClose();
                }}
              >
                Cancelar
              </CancelButton>
              <SaveButton onClick={handleSave}>Guardar</SaveButton>
            </ModalFooter>
          </>
        )}
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
  width: 400px;
  max-width: 90vw;
  max-height: 60vh;
  overflow-y: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
  margin-bottom: 30px;
  h2 {
    font-size: 20px;
    font-weight: bold;
    color: #333333;
    text-align: center;

    @media (max-width: 480px) {
      font-size: 18px;
    }
  }
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 5px;
  }
`;

const CancelButton = styled.button`
  background-color: #999;
  color: #dddddd;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;

  &:hover {
    background-color: #6b6b6b;
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 480px) {
    padding: 8px;
    font-size: 12px;
  }
`;

const SaveButton = styled.button`
  background-color: #333333;
  color: #dddddd;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;

  &:hover {
    background-color: #242424;
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 480px) {
    padding: 8px;
    font-size: 12px;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-weight: bold;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

export default GroupModal;
