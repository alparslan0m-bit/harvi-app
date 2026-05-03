/**
 * QuizImage — shows a question image thumbnail with a full-screen
 * pinch-to-zoom viewer on tap. Works for anatomy diagrams, X-rays,
 * histology slides, ECGs, etc.
 *
 * Usage:
 *   <QuizImage uri="https://..." />
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Props {
  uri: string;
  /** Caption shown below the thumbnail */
  caption?: string;
}

export function QuizImage({ uri, caption }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  if (!uri) return null;

  return (
    <>
      {/* ── Thumbnail ────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.thumbWrap}
        onPress={() => !error && setOpen(true)}
        activeOpacity={0.88}
      >
        {/* Skeleton while loading */}
        {!loaded && !error && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.skeleton}
          />
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="image" size={28} color="#94a3b8" />
            <Text style={styles.errorText}>Image unavailable</Text>
          </View>
        ) : (
          <Image
            source={{ uri }}
            style={[styles.thumb, { opacity: loaded ? 1 : 0 }]}
            contentFit="contain"
            transition={200}
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true); }}
          />
        )}

        {/* Expand hint badge */}
        {loaded && !error && (
          <View style={styles.expandBadge}>
            <Feather name="maximize-2" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {caption ? (
        <Text style={styles.caption}>{caption}</Text>
      ) : null}

      {/* ── Full-screen viewer ────────────────────────────────────────────── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBg}>
          <StatusBar hidden />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
              setOpen(false);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Pinch-to-zoom scroll view (native on iOS, pan on Android) */}
          <ScrollView
            ref={scrollRef}
            style={styles.zoomScroll}
            contentContainerStyle={styles.zoomContent}
            maximumZoomScale={6}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bouncesZoom
            centerContent
          >
            <Image
              source={{ uri }}
              style={styles.fullImg}
              contentFit="contain"
              transition={150}
            />
          </ScrollView>

          {/* Hint */}
          <View style={styles.hint}>
            <Feather name="zoom-in" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={styles.hintText}>Pinch to zoom</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Thumbnail ───────────────────────────────────────────────────────────
  thumbWrap: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#e2e8f0",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  expandBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    padding: 6,
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#94a3b8",
    fontFamily: "Inter_400Regular",
  },
  caption: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    textAlign: "center",
    marginBottom: 2,
    lineHeight: 17,
  },

  // ── Full-screen modal ───────────────────────────────────────────────────
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? 44 : 56,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
  },
  zoomScroll: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  zoomContent: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: "center",
    justifyContent: "center",
  },
  fullImg: {
    width: SCREEN_W,
    height: SCREEN_H * 0.82,
  },
  hint: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hintText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
  },
});
