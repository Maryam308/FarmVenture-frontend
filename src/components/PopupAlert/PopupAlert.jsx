import { useState, useEffect } from "react";
import styles from "./PopupAlert.module.css";

const PopupAlert = ({
  isOpen,
  onClose,
  title = "Alert",
  message,
  type = "info", // "info", "warning", "error", "success"
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  showCancel = false,
  autoClose = false,
  autoCloseTime = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 10);

      if (autoClose && type !== "warning") {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseTime);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, autoClose, autoCloseTime, type]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const typeStyles = {
    info: styles.info,
    warning: styles.warning,
    error: styles.error,
    success: styles.success,
  };

  const typeIcons = {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
    success: "✅",
  };

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.visible : ""}`}
      onClick={handleBackgroundClick}
    >
      <div
        className={`${styles.popup} ${isVisible ? styles.visible : ""} ${
          typeStyles[type]
        }`}
      >
        <div className={styles.popupHeader}>
          <div className={styles.titleSection}>
            <span className={styles.icon}>{typeIcons[type]}</span>
            <h3 className={styles.title}>{title}</h3>
          </div>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.popupContent}>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.popupActions}>
          {showCancel && (
            <button
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={handleClose}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`${styles.button} ${styles.confirmButton} ${typeStyles[type]}`}
            onClick={handleConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupAlert;
