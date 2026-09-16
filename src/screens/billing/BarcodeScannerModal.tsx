import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { LedgerColors } from "../../theme/colors";
import { feedbackService } from "../../services/feedbackService";
import { Button } from "../../components/common/Button";

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onScanned,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannedLock, setScannedLock] = useState(false);

  const handleBarcodeScanned = (scanningResult: { data: string }) => {
    if (scannedLock) return;
    setScannedLock(true);
    feedbackService.scanSuccess();
    onScanned(scanningResult.data);
    setTimeout(() => {
      setScannedLock(false);
    }, 1500);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim().length > 0) {
      feedbackService.scanSuccess();
      onScanned(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan Barcode</Text>
          <TouchableOpacity
            style={styles.torchBtn}
            onPress={() => setTorch((prev) => !prev)}
          >
            <Ionicons
              name={torch ? "flash" : "flash-off"}
              size={22}
              color={torch ? "#FBBF24" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Camera or Permission view */}
        {!permission?.granted ? (
          <View style={styles.permissionBox}>
            <Ionicons
              name="camera-outline"
              size={48}
              color={LedgerColors.ruleBorder}
            />
            <Text style={styles.permissionTitle}>
              Camera Permission Required
            </Text>
            <Text style={styles.permissionDesc}>
              Allow camera access to scan product barcodes directly from book
              covers and stationery packaging.
            </Text>
            <Button
              title="Grant Camera Access"
              onPress={requestPermission}
              variant="primary"
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "qr",
                ],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            />

            {/* Viewfinder Target Frame */}
            <View style={styles.overlay}>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <View style={styles.laserLine} />
              </View>
              <Text style={styles.helperText}>
                Align barcode within the red frame
              </Text>
            </View>
          </View>
        )}

        {/* Manual Barcode Entry Fallback */}
        <View style={styles.manualEntryContainer}>
          <Text style={styles.manualLabel}>Or Enter Barcode Manually:</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="e.g. 8901058850012"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
            />
            <Button
              title="Add"
              onPress={handleManualSubmit}
              disabled={manualCode.trim().length === 0}
              variant="primary"
              size="sm"
              style={{ minWidth: 60 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  closeBtn: {
    padding: 6,
  },
  topTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  torchBtn: {
    padding: 6,
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  targetFrame: {
    width: 280,
    height: 180,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: LedgerColors.crimson,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  laserLine: {
    width: "90%",
    height: 2,
    backgroundColor: LedgerColors.crimson,
    shadowColor: LedgerColors.crimson,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  helperText: {
    color: "#E2E8F0",
    fontSize: 13,
    marginTop: 20,
    fontWeight: "500",
  },
  permissionBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  permissionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  permissionDesc: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  manualEntryContainer: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  manualLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  manualInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#475569",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    fontSize: 14,
    height: 40,
  },
});
