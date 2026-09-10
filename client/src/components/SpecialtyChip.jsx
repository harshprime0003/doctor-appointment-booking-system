import { specialtyChipStyle } from '../utils/doctor.js';

export default function SpecialtyChip({ specialty }) {
  return (
    <span className="spec-chip" style={specialtyChipStyle(specialty)}>
      {specialty}
    </span>
  );
}
