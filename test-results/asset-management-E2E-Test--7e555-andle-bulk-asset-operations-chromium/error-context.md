# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e8]: Z
      - heading "Welcome back" [level=2] [ref=e9]
      - paragraph [ref=e10]: Sign in to your ZakApp account
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email address
          - textbox "Email address" [ref=e15]
        - generic [ref=e16]:
          - generic [ref=e17]: Password
          - textbox "Password" [ref=e18]
      - button "Sign in" [disabled] [ref=e19]
      - generic [ref=e20]:
        - paragraph [ref=e21]:
          - link "Forgot your password?" [ref=e22] [cursor=pointer]:
            - /url: /forgot-password
        - paragraph [ref=e23]:
          - text: Don't have an account?
          - link "Create one now" [ref=e24] [cursor=pointer]:
            - /url: /register
  - generic [ref=e25]:
    - img [ref=e27]
    - button "Open Tanstack query devtools" [ref=e75] [cursor=pointer]:
      - img [ref=e76] [cursor=pointer]
```