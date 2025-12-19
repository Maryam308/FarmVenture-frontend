import Edit from "../../assets/images/edit.svg";
import Trash from "../../assets/images/trash.svg";
import Create from "../../assets/images/create.svg";
import Calendar from "../../assets/images/calendar.svg";

const Icon = ({ category }) => {
  const icons = {
    Edit: Edit,
    Trash: Trash,
    Create: Create,
    Calendar: Calendar,
  };

  return (
    <img
      src={icons[category]}
      alt={`A ${category} icon.`}
      id={category.toLowerCase()}
      className="icon"
    />
  );
};

export default Icon;