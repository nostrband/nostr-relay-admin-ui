import { FC, ReactNode } from "react";
import { Button } from "react-bootstrap";
import { TrashFill } from "react-bootstrap-icons";
import cl from "./EventWrapper.module.css";

type eventWrapperProps = {
  type: string;
  isApproved?: boolean;
  onRemoveTask: () => void;
  onApproveTask: () => void;
  children: ReactNode;
};

const EventWrapper: FC<eventWrapperProps> = ({
  isApproved,
  onRemoveTask,
  onApproveTask,
  type,
  children,
}) => {
  return (
    <div className={cl.eventWrapper}>
      {children}
      {type === "events" ? (
        <div className={cl.reviewButtons}>
          <Button variant="outline-danger" size="sm">
            {<TrashFill />}
          </Button>
        </div>
      ) : type === "review" ? (
        <>
          <div className={cl.reviewButtons}>
            <Button
              variant={`outline-${isApproved ? "success" : "secondary"}`}
              size="sm"
              onClick={onApproveTask}
            >
              {isApproved ? "Approved" : "Approve"}
            </Button>
            <Button variant="outline-danger" size="sm" onClick={onRemoveTask}>
              Reject
            </Button>
          </div>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export default EventWrapper;
