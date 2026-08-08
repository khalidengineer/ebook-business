import tkinter as tk
from tkinter import messagebox
import pyautogui
import pyperclip
import threading
import time
import os

class AutomatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Python Labs Automator")
        self.root.geometry("400x300")
        self.root.attributes("-topmost", True)  # Always on top

        self.is_running = False
        self.prompts = []

        # GUI Elements
        tk.Label(root, text="Delay between prompts (seconds):", font=("Arial", 10)).pack(pady=(15, 5))
        
        self.delay_var = tk.StringVar(value="40")
        self.delay_entry = tk.Entry(root, textvariable=self.delay_var, font=("Arial", 12), width=10, justify="center")
        self.delay_entry.pack()

        tk.Label(root, text="Ensure 'prompts.txt' exists in this folder.", font=("Arial", 8, "italic"), fg="gray").pack(pady=5)

        self.start_btn = tk.Button(root, text="Start Automation", bg="#1a73e8", fg="white", font=("Arial", 10, "bold"), command=self.start)
        self.start_btn.pack(pady=10, fill=tk.X, padx=50)

        self.stop_btn = tk.Button(root, text="Stop", bg="#dc3545", fg="white", font=("Arial", 10, "bold"), state=tk.DISABLED, command=self.stop)
        self.stop_btn.pack(pady=5, fill=tk.X, padx=50)

        self.status_label = tk.Label(root, text="Ready", font=("Arial", 12, "bold"), fg="#1a73e8", wraplength=380, justify="center")
        self.status_label.pack(pady=15)

    def load_prompts(self):
        if not os.path.exists("prompts.txt"):
            messagebox.showerror("Error", "prompts.txt file not found! Please create it.")
            return False
            
        with open("prompts.txt", "r", encoding="utf-8") as f:
            content = f.read()
            
        if '\n\n' in content:
            raw_prompts = content.split('\n\n')
        else:
            raw_prompts = content.split('\n')
            
        self.prompts = [p.strip() for p in raw_prompts if p.strip()]
        
        if not self.prompts:
            messagebox.showerror("Error", "No prompts found in prompts.txt!")
            return False
            
        return True

    def start(self):
        if not self.load_prompts():
            return
            
        try:
            self.delay = int(self.delay_var.get())
        except ValueError:
            messagebox.showerror("Error", "Invalid delay amount!")
            return

        self.is_running = True
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)
        self.delay_entry.config(state=tk.DISABLED)

        # Start automation in a background thread
        threading.Thread(target=self.automation_loop, daemon=True).start()

    def stop(self):
        self.is_running = False
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)
        self.delay_entry.config(state=tk.NORMAL)
        self.update_status("🛑 Automation stopped.")

    def update_status(self, text):
        self.status_label.config(text=text)

    def wait_with_countdown(self, seconds, prompt_num, total_prompts):
        for i in range(seconds, 0, -1):
            if not self.is_running:
                return False
            self.update_status(f"✅ Prompt {prompt_num} of {total_prompts} Sent!\n\n⏳ Next prompt in: {i} seconds...")
            time.sleep(1)
        return True

    def automation_loop(self):
        total = len(self.prompts)
        self.update_status(f"Total Prompts Loaded: {total}\n\nClick the input box now!")
        
        # Initial wait
        for i in range(5, 0, -1):
            if not self.is_running: return
            self.update_status(f"Total Prompts: {total}\n\nStarting in: {i} seconds...\n(Click inside the website box!)")
            time.sleep(1)

        for i, prompt in enumerate(self.prompts):
            if not self.is_running:
                break
                
            self.update_status(f"⚡ Typing Prompt {i+1} of {total}...")
            
            # Copy to clipboard
            pyperclip.copy(prompt)
            time.sleep(0.5)
            
            # Paste (Ctrl+V)
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(1.5) # Wait for UI to register the paste
            
            # Press Enter to submit
            pyautogui.press('enter')
            
            # Wait for the delay (unless it's the last prompt)
            if i < total - 1:
                if not self.wait_with_countdown(self.delay, i+1, total):
                    break
            else:
                self.update_status(f"🎉 All {total} prompts completed successfully!")
                
        # Reset UI
        self.root.after(0, self.stop)

if __name__ == "__main__":
    root = tk.Tk()
    app = AutomatorApp(root)
    root.mainloop()
