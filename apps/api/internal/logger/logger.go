package logger

import (
	"log/slog"
	"os"
	"strings"
)

var Logger *slog.Logger

func init() {
	Logger = New()
}

func New() *slog.Logger {
	level := getLogLevel()
	format := getLogFormat()

	var handler slog.Handler

	opts := &slog.HandlerOptions{
		Level: level,
	}

	switch format {
	case "json":
		handler = slog.NewJSONHandler(os.Stdout, opts)
	default:
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}

func getLogLevel() slog.Level {
	level := strings.ToLower(os.Getenv("LOG_LEVEL"))
	switch level {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		env := os.Getenv("ENV")
		if env == "production" {
			return slog.LevelInfo
		}
		return slog.LevelDebug
	}
}

func getLogFormat() string {
	format := strings.ToLower(os.Getenv("LOG_FORMAT"))
	if format == "json" {
		return "json"
	}
	
	env := os.Getenv("ENV")
	if env == "production" {
		return "json"
	}
	return "text"
}

func Info(msg string, args ...any) {
	Logger.Info(msg, args...)
}

func Debug(msg string, args ...any) {
	Logger.Debug(msg, args...)
}

func Warn(msg string, args ...any) {
	Logger.Warn(msg, args...)
}

func Error(msg string, args ...any) {
	Logger.Error(msg, args...)
}

func Fatal(msg string, args ...any) {
	Logger.Error(msg, args...)
	os.Exit(1)
}

func With(args ...any) *slog.Logger {
	return Logger.With(args...)
}