package service

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/QuantumNous/new-api/common"
)

var aesKey []byte

func InitAESKey() error {
	key := os.Getenv("AES_KEY")
	if len(key) != 32 {
		key = "default-aes-key-32-bytes-length!"
	}
	aesKey = []byte(key)
	return nil
}

func EncryptPassword(plaintext string) (string, error) {
	common.SysLog(fmt.Sprintf("[EncryptPassword] Input plaintext length: %d, value: '%s'", len(plaintext), plaintext))
	
	if len(aesKey) == 0 {
		if err := InitAESKey(); err != nil {
			return "", err
		}
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	encoded := base64.StdEncoding.EncodeToString(ciphertext)
	common.SysLog(fmt.Sprintf("[EncryptPassword] Output ciphertext: '%s'", encoded))
	return encoded, nil
}

func DecryptPassword(ciphertext string) (string, error) {
	if len(aesKey) == 0 {
		if err := InitAESKey(); err != nil {
			return "", err
		}
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, cipherData := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, cipherData, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
