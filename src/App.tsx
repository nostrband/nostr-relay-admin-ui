import { Container, Row, Col, Button } from "react-bootstrap";
import Home from "./pages/Home/Home";
import { useEffect, useLayoutEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks/redux";
import { toast } from "react-toastify";
import { userSlice } from "./store/reducers/UserSlice";
import ReactModal from "react-modal";
import { X } from "react-bootstrap-icons";
import "./App.css";
import { sendPostAuth } from "./http/http";

function App() {
  const [isModal, setIsModal] = useState<boolean>(false);
  const { ndk } = useAppSelector((store) => store.connectionReducer);
  const store = useAppSelector((store) => store.userReducer);
  const dispatch = useAppDispatch();
  const { setIsAuth, setUser } = userSlice.actions;

  useLayoutEffect(() => {
    ndk.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const getUser = async (pubkey: string): Promise<void> => {
    //@ts-ignore
    const user = await ndk.fetchEvent({ kinds: [0], authors: [pubkey] });
    const userContent = user?.content ? JSON.parse(user.content) : {};
    dispatch(setUser(userContent));
  };

  useEffect(() => {
    (async () => {
      const pubkey = localStorage.getItem("login");

      if (pubkey) {
        getUser(pubkey);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isAuth]);

  const loginBtn = async (): Promise<void> => {
    if (window.nostr) {
      const pubkey = await window.nostr.getPublicKey();
      dispatch(setIsAuth(true));
      localStorage.setItem("login", pubkey);
      setIsModal(false);
    } else {
      toast.error("Browser extension not found!", { autoClose: 3000 });
      setIsModal(false);
    }
  };

  const closeModal = (): void => setIsModal(false);

  return (
    <Container>
      <ReactModal
        isOpen={isModal}
        onAfterOpen={() => {
          document.body.style.overflow = "hidden";
        }}
        onAfterClose={() => {
          document.body.style.overflow = "auto";
        }}
        onRequestClose={closeModal}
        ariaHideApp={false}
        className="login-modal"
        style={{ overlay: { zIndex: 6, background: "rgba(0,0,0,.4)" } }}
      >
        <div className="modal-header">
          <h4>Login</h4>
          <Button
            variant="link"
            style={{ fontSize: "1.8rem", color: "black" }}
            onClick={closeModal}
          >
            <X color="var(--body-color)" />
          </Button>
        </div>
        <hr />
        <div className="modal-body">
          <div>
            <Button variant="outline-primary" onClick={loginBtn}>
              Login with browser extension
            </Button>
          </div>
          <p className="mt-2">
            Please login using Nostr browser extension. You can try{" "}
            <a href="https://getalby.com/" target="_blank">
              Alby
            </a>
            ,{" "}
            <a
              href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp"
              target="_blank"
            >
              nos2x
            </a>{" "}
            or{" "}
            <a
              href="https://testflight.apple.com/join/ouPWAQAV"
              target="_blank"
            >
              Nostore
            </a>{" "}
            (for Safari).
          </p>
        </div>
        <hr />
        <div className="modal-footer">
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </div>
      </ReactModal>
      <Row className="justify-content-lg-center">
        <Col lg={9}>
          <div className="header">
            <h3>Nostr Dashboard</h3>
            {!store.isAuth ? (
              <Button
                variant="outline-primary"
                onClick={() => setIsModal(true)}
              >
                Login
              </Button>
            ) : (
              <p>{store.user?.display_name ?? store.user?.name}</p>
            )}
          </div>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
