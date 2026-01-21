import Modal from "@mui/material/Modal";
import React, { useState, useEffect } from "react";
import FadeAnim from "@/components/ui/animations/fadeAnim";
interface OverlayProps {
  clearOverlay: Function;
  children?: any | any[];
}

export default function Overlay(props: OverlayProps) {
  const [open, setOpen] = useState(false);

  // If props.children is not an empty string, open the backdrop
  useEffect(() => {
    if (props.children !== "") {
      setOpen(true);
    }
  }, [props.children]);

  function closeModal() {
    props.clearOverlay();
    setTimeout(() => {
      setOpen(false);
    }, 300);
  }

  return (
    <Modal
      style={{
        display: "flex",
        overflowY: "scroll",
        scrollBehavior: "smooth",
      }}
      open={open}
      onClick={closeModal}
    >
      <FadeAnim myname="overlay" in={open}>
        {props.children !== "" ? props.children : []}
      </FadeAnim>
    </Modal>
  );
}
