from app.extensions.ai_chat import (
    install as ai_chat_install,
    uninstall as ai_chat_uninstall,
)


INSTALLER = {
    "ai_chat": ai_chat_install,
}

UNINSTALLER = {
    "ai_chat": ai_chat_uninstall,
}
