package com.backtest.service;

import com.backtest.model.Role;
import com.backtest.model.User;
import com.backtest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public UserDetailsService userDetailsService() {
        return new UserDetailsService() {
            @Override
            public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
                return userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException("Username not found"));
            }
        };
    }

    public User save(User user) {
        user.setLastUpdated(System.currentTimeMillis());
        return userRepository.save(user);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public boolean isAdmin(String username) {
        Optional<User> userOptional = getUserByUsername(username);

        if (userOptional.isPresent()) {
            return isAdmin(userOptional.get());
        }

        return false;
    }

    public boolean isAdmin(User user) {
        if (user != null)
            return (user.getRole() == Role.ROLE_ADMIN);

        return false;
    }
}
